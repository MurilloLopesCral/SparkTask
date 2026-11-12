import { and, eq, gte, inArray, lte } from 'drizzle-orm';
import { db } from './db';
import { groupMember, project, task } from './db/schema';
import { addDays, dueOffsetLookbackDays } from '$lib/recurrence/schedule';
import {
	ghostSlotsForRecurrence,
	listEnabledRecurrencesForProjects,
	materializeDueRecurrences
} from './recurrence';

export type CalendarEventKind = 'task' | 'ghost';

export type CalendarEvent = {
	id: string;
	kind: CalendarEventKind;
	title: string;
	description: string | null;
	date: string;
	priority: string;
	type: string;
	status: string | null;
	projectId: string;
	projectName: string;
	groupId: string;
	ownerId: string | null;
	ownerName: string | null;
	taskId: string | null;
	recurrenceId: string | null;
};

export type CalendarQuery = {
	groupId: string;
	userId?: string;
	projectId?: string;
	from: string;
	to: string;
};

async function assertGroupMembership(userId: string, groupId: string) {
	const rows = await db
		.select({ groupId: groupMember.groupId })
		.from(groupMember)
		.where(and(eq(groupMember.groupId, groupId), eq(groupMember.memberId, userId)))
		.limit(1);
	return rows.length > 0;
}

/**
 * Calendar feed for a group: real tasks with dueDate in range + ghost
 * recurrence occurrences not yet materialized (Outlook-style).
 */
export async function getCalendarEvents(viewerId: string, query: CalendarQuery) {
	if (!(await assertGroupMembership(viewerId, query.groupId))) {
		return { ok: false as const, message: 'Você não tem acesso a este grupo.', status: 403 };
	}

	// Safety net — materialize anything due through today before reading.
	await materializeDueRecurrences();

	const projects = await db
		.select({ id: project.id, name: project.name, groupId: project.groupId })
		.from(project)
		.where(eq(project.groupId, query.groupId));

	if (query.projectId && !projects.some((p) => p.id === query.projectId)) {
		return { ok: false as const, message: 'Projeto não pertence a este grupo.', status: 400 };
	}

	const projectIds = query.projectId
		? [query.projectId]
		: projects.map((p) => p.id);
	if (projectIds.length === 0) {
		return { ok: true as const, events: [] as CalendarEvent[] };
	}

	const projectNameById = new Map(projects.map((p) => [p.id, p.name]));

	const taskConditions = [
		inArray(task.projectId, projectIds),
		gte(task.dueDate, query.from),
		lte(task.dueDate, query.to)
	];
	if (query.userId) {
		taskConditions.push(eq(task.ownerId, query.userId));
	}

	const tasks = await db.query.task.findMany({
		where: and(...taskConditions),
		with: {
			owner: { columns: { id: true, name: true, email: true } },
			project: { columns: { id: true, name: true, groupId: true } }
		},
		orderBy: (t, { asc }) => [asc(t.dueDate)]
	});

	const events: CalendarEvent[] = tasks.map((t) => ({
		id: t.id,
		kind: 'task' as const,
		title: t.title,
		description: t.description,
		date: t.dueDate!,
		priority: t.priority,
		type: t.type,
		status: t.status,
		projectId: t.projectId,
		projectName: t.project?.name ?? projectNameById.get(t.projectId) ?? '',
		groupId: t.project?.groupId ?? query.groupId,
		ownerId: t.ownerId,
		ownerName: t.owner?.name ?? t.owner?.email ?? null,
		taskId: t.id,
		recurrenceId: t.recurrenceId
	}));

	const recurrences = await listEnabledRecurrencesForProjects(projectIds);
	const filteredRecurrences = query.userId
		? recurrences.filter((r) => r.ownerId === query.userId)
		: recurrences;

	const maxLookback = filteredRecurrences.reduce((max, row) => {
		const lookback = dueOffsetLookbackDays({
			mode: row.dueOffsetMode,
			days: row.dueOffsetDays
		});
		return Math.max(max, lookback);
	}, 0);
	const occurrenceFrom = maxLookback > 0 ? addDays(query.from, -maxLookback) : query.from;

	const materializedByRecurrence = new Map<string, Set<string>>();
	for (const t of tasks) {
		if (!t.recurrenceId || !t.recurrenceOccurrenceDate) continue;
		let set = materializedByRecurrence.get(t.recurrenceId);
		if (!set) {
			set = new Set();
			materializedByRecurrence.set(t.recurrenceId, set);
		}
		set.add(t.recurrenceOccurrenceDate);
	}

	// Occurrences may sit before the visible window when dueDate is offset later.
	const occurrenceRows = await db
		.select({
			recurrenceId: task.recurrenceId,
			occurrence: task.recurrenceOccurrenceDate
		})
		.from(task)
		.where(
			and(
				inArray(task.projectId, projectIds),
				gte(task.recurrenceOccurrenceDate, occurrenceFrom),
				lte(task.recurrenceOccurrenceDate, query.to)
			)
		);

	for (const row of occurrenceRows) {
		if (!row.recurrenceId || !row.occurrence) continue;
		let set = materializedByRecurrence.get(row.recurrenceId);
		if (!set) {
			set = new Set();
			materializedByRecurrence.set(row.recurrenceId, set);
		}
		set.add(row.occurrence);
	}

	for (const row of filteredRecurrences) {
		const materialized = materializedByRecurrence.get(row.id) ?? new Set();
		const ghosts = ghostSlotsForRecurrence(row, query.from, query.to, materialized);
		for (const slot of ghosts) {
			events.push({
				id: `ghost:${row.id}:${slot.occurrenceDate}`,
				kind: 'ghost',
				title: row.title,
				description: row.description,
				date: slot.dueDate,
				priority: row.priority,
				type: row.type,
				status: null,
				projectId: row.projectId,
				projectName: row.project?.name ?? projectNameById.get(row.projectId) ?? '',
				groupId: row.project?.groupId ?? query.groupId,
				ownerId: row.ownerId,
				ownerName: row.owner?.name ?? row.owner?.email ?? null,
				taskId: null,
				recurrenceId: row.id
			});
		}
	}

	events.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.title.localeCompare(b.title)));

	return { ok: true as const, events };
}
