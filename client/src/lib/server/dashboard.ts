import { and, count, eq, gte, inArray, sql } from 'drizzle-orm';
import { db } from './db';
import { groupMember, project, task } from './db/schema';

const PENDING_STATUSES = ['not_started', 'in_progress', 'stand_by'] as const;
const TZ = 'America/Sao_Paulo';

const WEEKDAY_LABELS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'] as const;
const MONTH_LABELS = [
	'jan',
	'fev',
	'mar',
	'abr',
	'mai',
	'jun',
	'jul',
	'ago',
	'set',
	'out',
	'nov',
	'dez'
] as const;

async function getVisibleGroupIds(userId: string) {
	const memberships = await db
		.select({ groupId: groupMember.groupId })
		.from(groupMember)
		.where(eq(groupMember.memberId, userId));
	return memberships.map((m) => m.groupId);
}

async function getVisibleProjects(userId: string) {
	const groupIds = await getVisibleGroupIds(userId);
	if (groupIds.length === 0) return [];

	return db
		.select({ id: project.id, name: project.name, groupId: project.groupId })
		.from(project)
		.where(inArray(project.groupId, groupIds));
}

function startOfMonthLocal(now = new Date()) {
	return new Date(now.getFullYear(), now.getMonth(), 1);
}

function monthsBackLocal(countMonths: number, now = new Date()) {
	return new Date(now.getFullYear(), now.getMonth() - (countMonths - 1), 1);
}

/** Monday–Friday dates for the week containing `now` (local calendar). */
function workWeekDays(now = new Date()) {
	const day = now.getDay(); // 0 Sun … 6 Sat
	const mondayOffset = day === 0 ? -6 : 1 - day;
	const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + mondayOffset);
	return Array.from({ length: 5 }, (_, i) => {
		const d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
		return d;
	});
}

function countWeekdaysElapsed(now = new Date()) {
	const year = now.getFullYear();
	const month = now.getMonth();
	const upTo = now.getDate();
	let n = 0;
	for (let day = 1; day <= upTo; day++) {
		const wd = new Date(year, month, day).getDay();
		if (wd !== 0 && wd !== 6) n++;
	}
	return Math.max(n, 1);
}

function monthKey(year: number, monthIndex: number) {
	return `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
}

function lastMonthKeys(countMonths: number, now = new Date()) {
	const keys: { key: string; label: string }[] = [];
	for (let i = countMonths - 1; i >= 0; i--) {
		const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
		keys.push({
			key: monthKey(d.getFullYear(), d.getMonth()),
			label: MONTH_LABELS[d.getMonth()]
		});
	}
	return keys;
}

export async function getHomeDashboard(userId: string) {
	const projects = await getVisibleProjects(userId);
	const projectIds = projects.map((p) => p.id);
	const groupIds = await getVisibleGroupIds(userId);

	if (projectIds.length === 0) {
		return emptyDashboard(projects);
	}

	const now = new Date();
	const monthStart = startOfMonthLocal(now);
	const weekDays = workWeekDays(now);
	const weekStart = weekDays[0];
	const weekEnd = new Date(
		weekDays[4].getFullYear(),
		weekDays[4].getMonth(),
		weekDays[4].getDate() + 1
	);
	const historyStart = monthsBackLocal(6, now);
	const monthBuckets = lastMonthKeys(6, now);

	const [
		pendingRow,
		doneMonthRow,
		totalRow,
		memberRows,
		weekDoneRows,
		monthlyRows
	] = await Promise.all([
		db
			.select({ value: count() })
			.from(task)
			.where(
				and(
					inArray(task.projectId, projectIds),
					eq(task.ownerId, userId),
					inArray(task.status, [...PENDING_STATUSES])
				)
			)
			.then((r) => r[0]),
		db
			.select({ value: count() })
			.from(task)
			.where(
				and(
					inArray(task.projectId, projectIds),
					eq(task.ownerId, userId),
					eq(task.status, 'done'),
					gte(task.updatedAt, monthStart)
				)
			)
			.then((r) => r[0]),
		db
			.select({ value: count() })
			.from(task)
			.where(inArray(task.projectId, projectIds))
			.then((r) => r[0]),
		db
			.selectDistinct({ memberId: groupMember.memberId })
			.from(groupMember)
			.where(inArray(groupMember.groupId, groupIds)),
		db
			.select({
				dayKey: sql<string>`to_char((${task.updatedAt} AT TIME ZONE ${TZ}), 'YYYY-MM-DD')`,
				value: count()
			})
			.from(task)
			.where(
				and(
					inArray(task.projectId, projectIds),
					eq(task.ownerId, userId),
					eq(task.status, 'done'),
					gte(task.updatedAt, weekStart),
					sql`${task.updatedAt} < ${weekEnd}`
				)
			)
			.groupBy(sql`to_char((${task.updatedAt} AT TIME ZONE ${TZ}), 'YYYY-MM-DD')`),
		db
			.select({
				monthKey: sql<string>`to_char((${task.updatedAt} AT TIME ZONE ${TZ}), 'YYYY-MM')`,
				projectId: task.projectId,
				value: count()
			})
			.from(task)
			.where(
				and(
					inArray(task.projectId, projectIds),
					eq(task.status, 'done'),
					gte(task.updatedAt, historyStart)
				)
			)
			.groupBy(
				sql`to_char((${task.updatedAt} AT TIME ZONE ${TZ}), 'YYYY-MM')`,
				task.projectId
			)
	]);

	const pendingTasks = Number(pendingRow?.value ?? 0);
	const completedThisMonth = Number(doneMonthRow?.value ?? 0);
	const weekdayElapsed = countWeekdaysElapsed(now);
	const dailyAverage = Math.round((completedThisMonth / weekdayElapsed) * 10) / 10;

	const doneByDay = new Map(
		weekDoneRows.map((r) => [r.dayKey, Number(r.value)])
	);
	const weekProgress = weekDays.map((d, i) => {
		const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
		return {
			day: WEEKDAY_LABELS[i],
			dateKey: key,
			completed: doneByDay.get(key) ?? 0
		};
	});

	const totalTasks = Number(totalRow?.value ?? 0);
	const memberCount = Math.max(memberRows.length, 1);
	const groupAverage = Math.round((totalTasks / memberCount) * 10) / 10;

	const monthlyByProject = monthlyRows.map((r) => ({
		monthKey: r.monthKey,
		projectId: r.projectId,
		count: Number(r.value)
	}));

	return {
		userStats: {
			pendingTasks,
			completedThisMonth,
			dailyAverage,
			weekProgress
		},
		groupStats: {
			averageTasks: groupAverage,
			totalTasks,
			memberCount,
			months: monthBuckets,
			monthlyByProject,
			projects: projects.map((p) => ({ id: p.id, name: p.name }))
		}
	};
}

function emptyDashboard(projects: { id: string; name: string; groupId: string }[]) {
	const now = new Date();
	const weekDays = workWeekDays(now);
	return {
		userStats: {
			pendingTasks: 0,
			completedThisMonth: 0,
			dailyAverage: 0,
			weekProgress: weekDays.map((d, i) => ({
				day: WEEKDAY_LABELS[i],
				dateKey: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
				completed: 0
			}))
		},
		groupStats: {
			averageTasks: 0,
			totalTasks: 0,
			memberCount: 0,
			months: lastMonthKeys(6, now),
			monthlyByProject: [] as { monthKey: string; projectId: string; count: number }[],
			projects: projects.map((p) => ({ id: p.id, name: p.name }))
		}
	};
}

export type HomeDashboard = Awaited<ReturnType<typeof getHomeDashboard>>;
