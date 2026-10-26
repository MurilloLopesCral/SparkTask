import { and, eq, inArray, isNull } from 'drizzle-orm';
import { db } from './db';
import { task, taskExecution, userWorkSchedule } from './db/schema';
import {
	DEFAULT_WORK_SCHEDULE,
	timeToMinutes,
	type WorkSchedule
} from '$lib/users/work-schedule';

export type StoredWorkSchedule = WorkSchedule & { userId: string };

const WEEKDAY_TO_ISO: Record<string, number> = {
	Mon: 1,
	Tue: 2,
	Wed: 3,
	Thu: 4,
	Fri: 5,
	Sat: 6,
	Sun: 7
};

/** Local calendar parts for `date` in `timeZone`. */
export function zonedClock(date: Date, timeZone: string) {
	const parts = new Intl.DateTimeFormat('en-US', {
		timeZone,
		weekday: 'short',
		hour: '2-digit',
		minute: '2-digit',
		hourCycle: 'h23'
	}).formatToParts(date);

	const weekday = parts.find((p) => p.type === 'weekday')?.value ?? 'Mon';
	let hour = Number(parts.find((p) => p.type === 'hour')?.value ?? '0');
	const minute = Number(parts.find((p) => p.type === 'minute')?.value ?? '0');
	// Some engines report midnight as 24 with h23.
	if (hour === 24) hour = 0;

	return {
		isoWeekday: WEEKDAY_TO_ISO[weekday] ?? 1,
		minutes: hour * 60 + minute
	};
}

/**
 * True when `now` falls on a configured work day and within [start, end).
 * Overnight windows (end <= start) are treated as invalid → outside hours.
 */
export function isWithinWorkHours(schedule: WorkSchedule, now = new Date()): boolean {
	if (!schedule.enabled) return true;

	const start = timeToMinutes(schedule.startTime);
	const end = timeToMinutes(schedule.endTime);
	if (start == null || end == null || end <= start) return true;

	const days = normalizeWorkDays(schedule.workDays);
	// Enabled with no days selected = never inside the window.
	if (days.length === 0) return false;

	const { isoWeekday, minutes } = zonedClock(
		now,
		schedule.timezone || DEFAULT_WORK_SCHEDULE.timezone
	);
	if (!days.includes(isoWeekday)) return false;
	return minutes >= start && minutes < end;
}

export function normalizeWorkDays(days: unknown): number[] {
	let raw: unknown[] = [];
	if (Array.isArray(days)) {
		raw = days;
	} else if (typeof days === 'string') {
		try {
			const parsed = JSON.parse(days) as unknown;
			raw = Array.isArray(parsed) ? parsed : [];
		} catch {
			raw = [];
		}
	}

	return [
		...new Set(
			raw
				.map((d) => (typeof d === 'string' ? Number(d) : d))
				.filter((d): d is number => typeof d === 'number' && Number.isInteger(d) && d >= 1 && d <= 7)
		)
	].sort((a, b) => a - b);
}

function scheduleFromRow(row: {
	enabled: boolean;
	timezone: string;
	workDays: unknown;
	startTime: string;
	endTime: string;
}): WorkSchedule {
	return {
		enabled: row.enabled,
		timezone: row.timezone || DEFAULT_WORK_SCHEDULE.timezone,
		workDays: normalizeWorkDays(row.workDays ?? DEFAULT_WORK_SCHEDULE.workDays),
		startTime: row.startTime,
		endTime: row.endTime
	};
}

export async function getWorkSchedule(userId: string): Promise<StoredWorkSchedule> {
	const row = await db.query.userWorkSchedule.findFirst({
		where: eq(userWorkSchedule.userId, userId)
	});

	if (!row) {
		await db
			.insert(userWorkSchedule)
			.values({ userId, ...DEFAULT_WORK_SCHEDULE, updatedAt: new Date() })
			.onConflictDoNothing();
		return { userId, ...DEFAULT_WORK_SCHEDULE };
	}

	return { userId, ...scheduleFromRow(row) };
}

export async function upsertWorkSchedule(userId: string, input: WorkSchedule) {
	const values = {
		userId,
		enabled: input.enabled,
		timezone: input.timezone || DEFAULT_WORK_SCHEDULE.timezone,
		workDays: normalizeWorkDays(input.workDays),
		startTime: input.startTime,
		endTime: input.endTime,
		updatedAt: new Date()
	};

	await db
		.insert(userWorkSchedule)
		.values(values)
		.onConflictDoUpdate({
			target: userWorkSchedule.userId,
			set: {
				enabled: values.enabled,
				timezone: values.timezone,
				workDays: values.workDays,
				startTime: values.startTime,
				endTime: values.endTime,
				updatedAt: values.updatedAt
			}
		});

	return getWorkSchedule(userId);
}

async function pauseOpenExecutionsForUsers(userIds: string[], endedAt: Date) {
	if (userIds.length === 0) {
		return { pausedExecutions: 0, taskIds: [] as string[] };
	}

	const open = await db
		.select({
			id: taskExecution.id,
			taskId: taskExecution.taskId,
			userId: taskExecution.userId
		})
		.from(taskExecution)
		.where(and(inArray(taskExecution.userId, userIds), isNull(taskExecution.endedAt)));

	if (open.length === 0) {
		return { pausedExecutions: 0, taskIds: [] as string[] };
	}

	const executionIds = open.map((row) => row.id);
	const taskIds = [...new Set(open.map((row) => row.taskId))];

	await db
		.update(taskExecution)
		.set({ endedAt, endReason: 'paused' })
		.where(inArray(taskExecution.id, executionIds));

	await db
		.update(task)
		.set({ status: 'stand_by', updatedAt: endedAt })
		.where(inArray(task.id, taskIds));

	return { pausedExecutions: executionIds.length, taskIds };
}

/**
 * Safety net for the current user — called on tasks page load / poll.
 * Covers Hobby cron gaps and failed cron invocations.
 */
export async function pauseUserIfOutsideWorkHours(userId: string, now = new Date()) {
	const schedule = await getWorkSchedule(userId);
	if (!schedule.enabled || isWithinWorkHours(schedule, now)) {
		return { paused: false, pausedExecutions: 0 };
	}

	const result = await pauseOpenExecutionsForUsers([userId], now);
	return {
		paused: result.pausedExecutions > 0,
		pausedExecutions: result.pausedExecutions
	};
}

/**
 * Pause open executions for every user who is currently outside their
 * enabled work window. Returns aggregate counts for cron logging.
 */
export async function pauseExecutionsOutsideWorkHours(now = new Date()) {
	const open = await db
		.select({
			id: taskExecution.id,
			taskId: taskExecution.taskId,
			userId: taskExecution.userId
		})
		.from(taskExecution)
		.where(isNull(taskExecution.endedAt));

	if (open.length === 0) {
		return { checkedUsers: 0, pausedExecutions: 0, pausedUsers: 0 };
	}

	const userIds = [...new Set(open.map((row) => row.userId))];
	const schedules = await db
		.select()
		.from(userWorkSchedule)
		.where(inArray(userWorkSchedule.userId, userIds));

	const scheduleByUser = new Map(schedules.map((s) => [s.userId, s]));

	const usersToPause: string[] = [];
	for (const userId of userIds) {
		const row = scheduleByUser.get(userId);
		const schedule: WorkSchedule = row
			? scheduleFromRow(row)
			: DEFAULT_WORK_SCHEDULE;

		if (!schedule.enabled) continue;
		if (!isWithinWorkHours(schedule, now)) usersToPause.push(userId);
	}

	if (usersToPause.length === 0) {
		return { checkedUsers: userIds.length, pausedExecutions: 0, pausedUsers: 0 };
	}

	const result = await pauseOpenExecutionsForUsers(usersToPause, now);

	return {
		checkedUsers: userIds.length,
		pausedExecutions: result.pausedExecutions,
		pausedUsers: usersToPause.length
	};
}
