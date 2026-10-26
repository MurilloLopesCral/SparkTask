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
	const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? '0');
	const minute = Number(parts.find((p) => p.type === 'minute')?.value ?? '0');

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

	const days = schedule.workDays.filter((d) => d >= 1 && d <= 7);
	if (days.length === 0) return true;

	const { isoWeekday, minutes } = zonedClock(now, schedule.timezone || DEFAULT_WORK_SCHEDULE.timezone);
	if (!days.includes(isoWeekday)) return false;
	return minutes >= start && minutes < end;
}

export function normalizeWorkDays(days: number[]): number[] {
	return [...new Set(days.filter((d) => Number.isInteger(d) && d >= 1 && d <= 7))].sort(
		(a, b) => a - b
	);
}

export async function getWorkSchedule(userId: string): Promise<StoredWorkSchedule> {
	const row = await db.query.userWorkSchedule.findFirst({
		where: eq(userWorkSchedule.userId, userId)
	});

	if (!row) {
		// Ensure every user has a schedule row (new signups after migration).
		await db
			.insert(userWorkSchedule)
			.values({ userId, ...DEFAULT_WORK_SCHEDULE, updatedAt: new Date() })
			.onConflictDoNothing();
		return { userId, ...DEFAULT_WORK_SCHEDULE };
	}

	return {
		userId,
		enabled: row.enabled,
		timezone: row.timezone,
		workDays: normalizeWorkDays(row.workDays ?? DEFAULT_WORK_SCHEDULE.workDays),
		startTime: row.startTime,
		endTime: row.endTime
	};
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
			? {
					enabled: row.enabled,
					timezone: row.timezone,
					workDays: normalizeWorkDays(row.workDays ?? []),
					startTime: row.startTime,
					endTime: row.endTime
				}
			: DEFAULT_WORK_SCHEDULE;

		if (!schedule.enabled) continue;
		if (!isWithinWorkHours(schedule, now)) usersToPause.push(userId);
	}

	if (usersToPause.length === 0) {
		return { checkedUsers: userIds.length, pausedExecutions: 0, pausedUsers: 0 };
	}

	const toClose = open.filter((row) => usersToPause.includes(row.userId));
	const executionIds = toClose.map((row) => row.id);
	const taskIds = [...new Set(toClose.map((row) => row.taskId))];
	const endedAt = now;

	await db
		.update(taskExecution)
		.set({ endedAt, endReason: 'paused' })
		.where(inArray(taskExecution.id, executionIds));

	if (taskIds.length > 0) {
		await db
			.update(task)
			.set({ status: 'stand_by', updatedAt: endedAt })
			.where(and(inArray(task.id, taskIds)));
	}

	return {
		checkedUsers: userIds.length,
		pausedExecutions: executionIds.length,
		pausedUsers: usersToPause.length
	};
}
