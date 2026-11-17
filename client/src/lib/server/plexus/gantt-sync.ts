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

/**
 * Push a Spark task to Plexus as a gantt item under the project's execution topic.
 * No-ops when Plexus env, project linkage, or owner.plexusUserId is missing.
 * Never throws to callers — failures are logged so Spark stays usable offline.
 */
export async function syncTaskToPlexusGantt(taskId: string): Promise<void> {
	try {
		await syncTaskToPlexusGanttStrict(taskId);
	} catch (err) {
		console.error('[plexus] sync gantt failed', { taskId, err: formatErr(err) });
	}
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

async function syncTaskToPlexusGanttStrict(taskId: string) {
	if (!getPlexusConfig()) return;

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

	if (!row) return;

	const scopeId = parsePlexusProjectId(row.plexusProjectId);
	const topicCode = row.plexusTopicCode?.trim();
	if (scopeId === null || !topicCode) return;

	const plexusOwnerId = row.ownerPlexusUserId;
	if (plexusOwnerId == null) {
		console.warn('[plexus] skip sync — responsável sem plexusUserId', {
			taskId,
			ownerId: row.ownerId
		});
		return;
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
		return;
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
}

function formatErr(err: unknown) {
	if (err instanceof PlexusApiError) {
		return { message: err.message, status: err.status, body: err.body };
	}
	if (err instanceof Error) return { message: err.message };
	return { message: String(err) };
}
