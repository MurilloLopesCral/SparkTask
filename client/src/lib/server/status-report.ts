import { and, asc, eq, gte, inArray, lte, sql, type SQL } from 'drizzle-orm';
import { db } from './db';
import {
	task,
	type taskKindEnum,
	type taskStatusEnum
} from './db/schema';
import { userCanAccessProject } from './projects';
import {
	computeStatusReportSummary,
	type StatusReportFilters,
	type StatusReportPayload,
	type StatusReportTaskRow
} from '$lib/projects/status-report';

const TZ = sql.raw("'America/Sao_Paulo'");

function ownerDisplayName(owner: { name: string | null; email: string } | null) {
	if (!owner) return 'Sem responsável';
	return owner.name?.trim() || owner.email;
}

/**
 * Build a printable status report for a project the caller can access.
 * Period filters use task.createdAt in America/Sao_Paulo calendar days.
 */
export async function buildProjectStatusReport(
	userId: string,
	filters: StatusReportFilters,
	periodLabel: string
): Promise<{ ok: true; report: StatusReportPayload } | { ok: false; status: number; message: string }> {
	if (!(await userCanAccessProject(userId, filters.projectId))) {
		return { ok: false, status: 403, message: 'Você não tem acesso a este projeto.' };
	}

	const projectRow = await db.query.project.findFirst({
		where: (p, { eq: e }) => e(p.id, filters.projectId),
		with: { group: { columns: { name: true } } },
		columns: { id: true, name: true }
	});

	if (!projectRow) {
		return { ok: false, status: 404, message: 'Projeto não encontrado.' };
	}

	const conditions: SQL[] = [eq(task.projectId, filters.projectId)];

	if (filters.status?.length) {
		conditions.push(inArray(task.status, filters.status));
	}
	if (filters.kind?.length) {
		conditions.push(inArray(task.kind, filters.kind));
	}
	if (filters.taskIds?.length) {
		conditions.push(inArray(task.id, filters.taskIds));
	}
	if (filters.createdAfter) {
		conditions.push(
			gte(
				sql`((${task.createdAt} AT TIME ZONE ${TZ})::date)`,
				filters.createdAfter
			)
		);
	}
	if (filters.createdBefore) {
		conditions.push(
			lte(
				sql`((${task.createdAt} AT TIME ZONE ${TZ})::date)`,
				filters.createdBefore
			)
		);
	}

	const rows = await db.query.task.findMany({
		where: and(...conditions),
		orderBy: [asc(task.status), asc(task.title)],
		columns: {
			id: true,
			title: true,
			status: true,
			priority: true,
			kind: true,
			dueDate: true
		},
		with: {
			owner: { columns: { name: true, email: true } }
		}
	});

	const tasks: StatusReportTaskRow[] = rows.map((row) => ({
		id: row.id,
		title: row.title,
		status: row.status as StatusReportTaskRow['status'],
		priority: row.priority as StatusReportTaskRow['priority'],
		kind: row.kind as StatusReportTaskRow['kind'],
		dueDate: row.dueDate,
		ownerName: ownerDisplayName(row.owner)
	}));

	const summary = computeStatusReportSummary(tasks);

	const report: StatusReportPayload = {
		project: {
			id: projectRow.id,
			name: projectRow.name,
			groupName: projectRow.group.name
		},
		generatedAt: new Date().toISOString(),
		period: {
			from: filters.createdAfter ?? null,
			to: filters.createdBefore ?? null,
			label: periodLabel
		},
		filters: {
			status: filters.status?.length ? filters.status : null,
			kind: filters.kind?.length ? filters.kind : null,
			specificTasks: Boolean(filters.taskIds?.length)
		},
		summary,
		observations: '',
		tasks
	};

	return { ok: true, report };
}

/** Compact task list for the multi-select in the report dialog. */
export async function listProjectTasksForReport(userId: string, projectId: string) {
	if (!(await userCanAccessProject(userId, projectId))) return null;

	return db.query.task.findMany({
		where: eq(task.projectId, projectId),
		orderBy: [asc(task.title)],
		columns: {
			id: true,
			title: true,
			status: true,
			kind: true,
			createdAt: true
		}
	});
}

export type ReportTaskListItem = NonNullable<
	Awaited<ReturnType<typeof listProjectTasksForReport>>
>[number];

export type { StatusReportFilters };
export type TaskStatusFilter = (typeof taskStatusEnum.enumValues)[number];
export type TaskKindFilter = (typeof taskKindEnum.enumValues)[number];
