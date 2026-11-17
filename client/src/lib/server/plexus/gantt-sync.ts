import { eq } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { db } from '../db';
import { project, task, user } from '../db/schema';
import { getPlexusConfig } from './config';
import { createGanttItem, deleteGanttItem, PlexusApiError, updateGanttItem } from './client';
import {
	ganttDateWindow,
	parsePlexusProjectId,
	toPercentComplete,
	toPlexusGanttStatus
} from './map';

const owner = alias(user, 'task_owner');

export type SyncTaskResult =
	| { status: 'created' }
	| { status: 'updated' }
	| { status: 'skipped'; reason: 'not_configured' | 'no_project_link' | 'no_owner_plexus' | 'not_found' }
	| { status: 'error'; message: string };

export type ProjectSyncSummary = {
	total: number;
	created: number;
	updated: number;
	skipped: number;
	failed: number;
	skipReasons: {
		noOwnerPlexus: number;
		noProjectLink: number;
		notConfigured: number;
	};
};

/**
 * Push a Spark task to Plexus as a gantt item under the project's execution topic.
 * No-ops when Plexus env, project linkage, or owner.plexusUserId is missing.
 * Never throws to callers — failures are logged so Spark stays usable offline.
 */
export async function syncTaskToPlexusGantt(taskId: string): Promise<void> {
	const result = await syncTaskToPlexusGanttResult(taskId);
	if (result.status === 'error') {
		console.error('[plexus] sync gantt failed', { taskId, message: result.message });
	} else if (result.status === 'skipped' && result.reason === 'no_owner_plexus') {
		console.warn('[plexus] skip sync — responsável sem plexusUserId', { taskId });
	}
}

export async function syncTaskToPlexusGanttResult(taskId: string): Promise<SyncTaskResult> {
	try {
		return await syncTaskToPlexusGanttStrict(taskId);
	} catch (err) {
		console.error('[plexus] sync gantt failed', { taskId, err: formatErr(err) });
		return { status: 'error', message: formatErrMessage(err) };
	}
}

/** Retroactive sync — all tasks of a project (create or update gantt items). */
export async function syncProjectTasksToPlexus(projectId: string): Promise<ProjectSyncSummary> {
	const summary: ProjectSyncSummary = {
		total: 0,
		created: 0,
		updated: 0,
		skipped: 0,
		failed: 0,
		skipReasons: { noOwnerPlexus: 0, noProjectLink: 0, notConfigured: 0 }
	};

	const rows = await db
		.select({ id: task.id })
		.from(task)
		.where(eq(task.projectId, projectId));

	summary.total = rows.length;

	for (const row of rows) {
		const result = await syncTaskToPlexusGanttResult(row.id);
		switch (result.status) {
			case 'created':
				summary.created += 1;
				break;
			case 'updated':
				summary.updated += 1;
				break;
			case 'skipped':
				summary.skipped += 1;
				if (result.reason === 'no_owner_plexus') summary.skipReasons.noOwnerPlexus += 1;
				else if (result.reason === 'no_project_link') summary.skipReasons.noProjectLink += 1;
				else if (result.reason === 'not_configured') summary.skipReasons.notConfigured += 1;
				break;
			case 'error':
				summary.failed += 1;
				break;
		}
	}

	return summary;
}

export async function deleteTaskGanttFromPlexus(taskId: string): Promise<void> {
	try {
		const [row] = await db
			.select({ plexusGanttItemId: task.plexusGanttItemId })
			.from(task)
			.where(eq(task.id, taskId))
			.limit(1);

		if (!row?.plexusGanttItemId || !getPlexusConfig()) return;

		await deleteGanttItem(row.plexusGanttItemId);
	} catch (err) {
		console.error('[plexus] delete gantt failed', { taskId, err: formatErr(err) });
	}
}

async function syncTaskToPlexusGanttStrict(taskId: string): Promise<SyncTaskResult> {
	if (!getPlexusConfig()) return { status: 'skipped', reason: 'not_configured' };

	const [row] = await db
		.select({
			id: task.id,
			title: task.title,
			description: task.description,
			status: task.status,
			dueDate: task.dueDate,
			createdAt: task.createdAt,
			ownerId: task.ownerId,
			plexusGanttItemId: task.plexusGanttItemId,
			plexusProjectId: project.plexusProjectId,
			plexusTopicCode: project.plexusTopicCode,
			ownerPlexusUserId: owner.plexusUserId
		})
		.from(task)
		.innerJoin(project, eq(project.id, task.projectId))
		.leftJoin(owner, eq(owner.id, task.ownerId))
		.where(eq(task.id, taskId))
		.limit(1);

	if (!row) return { status: 'skipped', reason: 'not_found' };

	const scopeId = parsePlexusProjectId(row.plexusProjectId);
	const topicCode = row.plexusTopicCode?.trim();
	if (scopeId === null || !topicCode) {
		return { status: 'skipped', reason: 'no_project_link' };
	}

	const plexusOwnerId = row.ownerPlexusUserId;
	if (plexusOwnerId == null) {
		return { status: 'skipped', reason: 'no_owner_plexus' };
	}

	const status = toPlexusGanttStatus(row.status);
	const percentComplete = toPercentComplete(row.status);
	const { startDate, endDate } = ganttDateWindow(row.dueDate, row.createdAt);

	if (row.plexusGanttItemId) {
		await updateGanttItem(row.plexusGanttItemId, {
			title: row.title,
			ownerId: plexusOwnerId,
			startDate,
			endDate,
			activityDescription: row.description,
			status,
			percentComplete
		});
		return { status: 'updated' };
	}

	const created = await createGanttItem({
		title: row.title,
		ownerId: plexusOwnerId,
		startDate,
		endDate,
		percentComplete,
		activityDescription: row.description,
		status,
		scopeType: 'PROJECT',
		scopeId,
		topicCode
	});

	await db
		.update(task)
		.set({ plexusGanttItemId: created.id, updatedAt: new Date() })
		.where(eq(task.id, taskId));

	return { status: 'created' };
}

function formatErr(err: unknown) {
	if (err instanceof PlexusApiError) {
		return { message: err.message, status: err.status, body: err.body };
	}
	if (err instanceof Error) return { message: err.message };
	return { message: String(err) };
}

function formatErrMessage(err: unknown) {
	const f = formatErr(err);
	return typeof f === 'object' && f && 'message' in f ? String(f.message) : String(err);
}
