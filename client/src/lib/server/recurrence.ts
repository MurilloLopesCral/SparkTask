import { and, desc, eq, inArray, lte } from 'drizzle-orm';
import { db } from './db';
import { groupMember, project, task, taskRecurrence } from './db/schema';
import type {
	recurrenceFrequencyEnum,
	taskKindEnum,
	taskPriorityEnum,
	taskTypeEnum
} from './db/schema';
import { userCanAccessProject } from './projects';
import {
	expandOccurrences,
	nextOccurrenceAfter,
	nextOccurrenceOnOrAfter,
	todayInTimeZone,
	type RecurrenceRule
} from '$lib/recurrence/schedule';

export type RecurrenceFrequency = (typeof recurrenceFrequencyEnum.enumValues)[number];

export type CreateRecurrenceInput = {
	projectId: string;
	title: string;
	description: string | null;
	priority: (typeof taskPriorityEnum.enumValues)[number];
	type: (typeof taskTypeEnum.enumValues)[number];
	kind: (typeof taskKindEnum.enumValues)[number];
	ownerId: string | null;
	createdBy: string;
	frequency: RecurrenceFrequency;
	weekdaysOnly?: boolean;
	weekDays?: number[];
	dayOfMonth?: number | null;
	timezone?: string;
	/** First due date (YYYY-MM-DD). Defaults to next match from today. */
	startFrom?: string;
};

export type UpdateRecurrenceInput = Partial<
	Omit<CreateRecurrenceInput, 'createdBy' | 'projectId'>
> & {
	enabled?: boolean;
	projectId?: string;
};

function toRule(row: {
	frequency: RecurrenceFrequency;
	weekdaysOnly: boolean;
	weekDays: number[] | null;
	dayOfMonth: number | null;
}): RecurrenceRule {
	return {
		frequency: row.frequency,
		weekdaysOnly: row.weekdaysOnly,
		weekDays: row.weekDays ?? [],
		dayOfMonth: row.dayOfMonth
	};
}

function normalizeWeekDays(days: number[] | undefined, frequency: RecurrenceFrequency) {
	if (frequency !== 'weekly') return [] as number[];
	return [...new Set((days ?? []).filter((d) => d >= 1 && d <= 7))].sort((a, b) => a - b);
}

async function getVisibleProjectIds(userId: string, groupId?: string) {
	const memberships = await db
		.select({ groupId: groupMember.groupId })
		.from(groupMember)
		.where(eq(groupMember.memberId, userId));
	const groupIds = memberships.map((m) => m.groupId);
	if (groupIds.length === 0) return [];

	const scoped = groupId && groupIds.includes(groupId) ? [groupId] : groupIds;
	const projects = await db
		.select({ id: project.id })
		.from(project)
		.where(inArray(project.groupId, scoped));
	return projects.map((p) => p.id);
}

export async function listRecurrencesForUser(userId: string, groupId?: string) {
	const projectIds = await getVisibleProjectIds(userId, groupId);
	if (projectIds.length === 0) return [];

	return db.query.taskRecurrence.findMany({
		where: inArray(taskRecurrence.projectId, projectIds),
		orderBy: [desc(taskRecurrence.updatedAt)],
		with: {
			project: { columns: { id: true, name: true, groupId: true } },
			owner: { columns: { id: true, name: true, email: true } }
		}
	});
}

export async function getRecurrenceById(id: string) {
	return db.query.taskRecurrence.findFirst({
		where: eq(taskRecurrence.id, id),
		with: {
			project: { columns: { id: true, name: true, groupId: true } },
			owner: { columns: { id: true, name: true, email: true } }
		}
	});
}

export async function createRecurrence(input: CreateRecurrenceInput) {
	const tz = input.timezone ?? 'America/Sao_Paulo';
	const weekDays = normalizeWeekDays(input.weekDays, input.frequency);
	if (input.frequency === 'weekly' && weekDays.length === 0) {
		return { ok: false as const, message: 'Selecione ao menos um dia da semana.', status: 400 };
	}
	if (input.frequency === 'monthly') {
		const day = input.dayOfMonth ?? 0;
		if (day < 1 || day > 31) {
			return { ok: false as const, message: 'Dia do mês inválido (1–31).', status: 400 };
		}
	}

	const rule: RecurrenceRule = {
		frequency: input.frequency,
		weekdaysOnly: input.weekdaysOnly ?? false,
		weekDays,
		dayOfMonth: input.dayOfMonth ?? null
	};
	const start = input.startFrom ?? todayInTimeZone(tz);
	const nextDueDate = nextOccurrenceOnOrAfter(start, rule);

	const [created] = await db
		.insert(taskRecurrence)
		.values({
			projectId: input.projectId,
			title: input.title.trim(),
			description: input.description,
			priority: input.priority,
			type: input.type,
			kind: input.kind,
			ownerId: input.ownerId,
			createdBy: input.createdBy,
			frequency: input.frequency,
			weekdaysOnly: input.weekdaysOnly ?? false,
			weekDays,
			dayOfMonth: input.frequency === 'monthly' ? input.dayOfMonth : null,
			timezone: tz,
			nextDueDate
		})
		.returning();

	return { ok: true as const, recurrence: created };
}

export async function updateRecurrence(id: string, input: UpdateRecurrenceInput) {
	const current = await getRecurrenceById(id);
	if (!current) return { ok: false as const, message: 'Recorrência não encontrada.', status: 404 };

	const frequency = input.frequency ?? current.frequency;
	const weekDays = normalizeWeekDays(input.weekDays ?? current.weekDays, frequency);
	if (frequency === 'weekly' && weekDays.length === 0) {
		return { ok: false as const, message: 'Selecione ao menos um dia da semana.', status: 400 };
	}
	const dayOfMonth =
		frequency === 'monthly' ? (input.dayOfMonth ?? current.dayOfMonth ?? 1) : null;
	if (frequency === 'monthly' && (dayOfMonth! < 1 || dayOfMonth! > 31)) {
		return { ok: false as const, message: 'Dia do mês inválido (1–31).', status: 400 };
	}

	const rule: RecurrenceRule = {
		frequency,
		weekdaysOnly: input.weekdaysOnly ?? current.weekdaysOnly,
		weekDays,
		dayOfMonth
	};
	const tz = input.timezone ?? current.timezone;
	const from = input.startFrom ?? todayInTimeZone(tz);
	const nextDueDate = nextOccurrenceOnOrAfter(from, rule);

	const [updated] = await db
		.update(taskRecurrence)
		.set({
			...(input.projectId ? { projectId: input.projectId } : {}),
			...(input.title !== undefined ? { title: input.title.trim() } : {}),
			...(input.description !== undefined ? { description: input.description } : {}),
			...(input.priority ? { priority: input.priority } : {}),
			...(input.type ? { type: input.type } : {}),
			...(input.kind ? { kind: input.kind } : {}),
			...(input.ownerId !== undefined ? { ownerId: input.ownerId } : {}),
			frequency,
			weekdaysOnly: input.weekdaysOnly ?? current.weekdaysOnly,
			weekDays,
			dayOfMonth,
			timezone: tz,
			...(input.enabled !== undefined ? { enabled: input.enabled } : {}),
			nextDueDate,
			updatedAt: new Date()
		})
		.where(eq(taskRecurrence.id, id))
		.returning();

	return { ok: true as const, recurrence: updated };
}

export async function setRecurrenceEnabled(id: string, enabled: boolean) {
	const [updated] = await db
		.update(taskRecurrence)
		.set({ enabled, updatedAt: new Date() })
		.where(eq(taskRecurrence.id, id))
		.returning();
	if (!updated) return { ok: false as const, message: 'Recorrência não encontrada.', status: 404 };
	return { ok: true as const, recurrence: updated };
}

async function materializeOne(row: typeof taskRecurrence.$inferSelect, dueDate: string) {
	const existing = await db.query.task.findFirst({
		where: and(eq(task.recurrenceId, row.id), eq(task.recurrenceOccurrenceDate, dueDate)),
		columns: { id: true }
	});
	if (existing) return { created: false };

	await db.insert(task).values({
		title: row.title,
		description: row.description,
		projectId: row.projectId,
		dueDate,
		priority: row.priority,
		type: row.type,
		kind: row.kind,
		ownerId: row.ownerId,
		createdBy: row.createdBy,
		status: 'not_started',
		recurrenceId: row.id,
		recurrenceOccurrenceDate: dueDate
	});
	return { created: true };
}

/** Materializes due occurrences up to `horizon` (inclusive) and advances nextDueDate. */
export async function materializeDueRecurrences(horizon?: string) {
	const rows = await db.query.taskRecurrence.findMany({
		where: eq(taskRecurrence.enabled, true)
	});

	let created = 0;
	let advanced = 0;

	for (const row of rows) {
		const until = horizon ?? todayInTimeZone(row.timezone);
		const rule = toRule(row);
		let next = row.nextDueDate;
		let changed = false;
		let guard = 0;

		while (next <= until && guard < 400) {
			const result = await materializeOne(row, next);
			if (result.created) created += 1;
			next = nextOccurrenceAfter(next, rule);
			changed = true;
			guard += 1;
		}

		if (changed || next !== row.nextDueDate) {
			await db
				.update(taskRecurrence)
				.set({ nextDueDate: next, updatedAt: new Date() })
				.where(eq(taskRecurrence.id, row.id));
			advanced += 1;
		}
	}

	return { checked: rows.length, created, advanced };
}

export async function userCanAccessRecurrence(userId: string, recurrenceId: string) {
	const row = await getRecurrenceById(recurrenceId);
	if (!row) return false;
	return userCanAccessProject(userId, row.projectId);
}

export function ghostDatesForRecurrence(
	row: {
		frequency: RecurrenceFrequency;
		weekdaysOnly: boolean;
		weekDays: number[] | null;
		dayOfMonth: number | null;
		enabled: boolean;
	},
	from: string,
	to: string,
	materializedDates: Set<string>
) {
	if (!row.enabled) return [];
	return expandOccurrences(from, to, toRule(row)).filter((d) => !materializedDates.has(d));
}

export async function listEnabledRecurrencesForProjects(projectIds: string[]) {
	if (projectIds.length === 0) return [];
	return db.query.taskRecurrence.findMany({
		where: and(inArray(taskRecurrence.projectId, projectIds), eq(taskRecurrence.enabled, true)),
		with: {
			project: { columns: { id: true, name: true, groupId: true } },
			owner: { columns: { id: true, name: true, email: true } }
		}
	});
}

export async function listRecurrencesDueOnOrBefore(date: string) {
	return db.query.taskRecurrence.findMany({
		where: and(eq(taskRecurrence.enabled, true), lte(taskRecurrence.nextDueDate, date))
	});
}
