import {
	TASK_KIND_META,
	TASK_PRIORITY_META,
	TASK_STATUS_META,
	type TaskKind,
	type TaskPriority,
	type TaskStatus
} from '$lib/tasks/constants';
import { formatDate } from '$lib/tasks/format';

export type StatusReportPeriodPreset =
	| 'all'
	| 'this_week'
	| 'this_month'
	| 'last_30'
	| 'this_quarter'
	| 'custom';

export type StatusReportFilters = {
	projectId: string;
	/** Inclusive YYYY-MM-DD — filters by task createdAt (America/Sao_Paulo day). */
	createdAfter?: string;
	createdBefore?: string;
	status?: TaskStatus[];
	kind?: TaskKind[];
	/** When set, only these task ids (still scoped to the project). */
	taskIds?: string[];
};

export type StatusReportTaskRow = {
	id: string;
	title: string;
	status: TaskStatus;
	priority: TaskPriority;
	kind: TaskKind;
	dueDate: string | null;
	ownerName: string;
	/** Sum of execution intervals for this task (seconds). */
	resolutionSeconds: number;
};

export type StatusReportPayload = {
	project: { id: string; name: string; groupName: string };
	generatedAt: string;
	period: { from: string | null; to: string | null; label: string };
	filters: {
		status: TaskStatus[] | null;
		kind: TaskKind[] | null;
		specificTasks: boolean;
	};
	summary: {
		total: number;
		pending: number;
		done: number;
		cancelled: number;
		/** done / (total - cancelled), 0–100. */
		progressPercent: number;
		/** Sum of resolutionSeconds across all listed tasks. */
		totalResolutionSeconds: number;
	};
	/** Free-form markdown notes shown between hero and task list. */
	observations: string;
	tasks: StatusReportTaskRow[];
};

const PENDING: TaskStatus[] = ['not_started', 'in_progress', 'stand_by'];

export function computeStatusReportSummary(
	tasks: { status: TaskStatus; resolutionSeconds?: number }[]
) {
	const total = tasks.length;
	const done = tasks.filter((t) => t.status === 'done').length;
	const cancelled = tasks.filter((t) => t.status === 'cancelled').length;
	const pending = tasks.filter((t) => PENDING.includes(t.status)).length;
	const eligible = total - cancelled;
	const progressPercent = eligible <= 0 ? 0 : Math.round((done / eligible) * 100);
	const totalResolutionSeconds = Math.round(
		tasks.reduce((sum, t) => sum + Math.max(0, t.resolutionSeconds ?? 0), 0)
	);

	return { total, pending, done, cancelled, progressPercent, totalResolutionSeconds };
}

/** Local calendar YYYY-MM-DD in the browser / server local TZ (UI dates). */
export function toDateInputValue(date: Date): string {
	const y = date.getFullYear();
	const m = String(date.getMonth() + 1).padStart(2, '0');
	const d = String(date.getDate()).padStart(2, '0');
	return `${y}-${m}-${d}`;
}

function startOfWeek(date: Date): Date {
	const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
	const day = d.getDay();
	const diff = day === 0 ? -6 : 1 - day; // Monday-start
	d.setDate(d.getDate() + diff);
	return d;
}

function startOfQuarter(date: Date): Date {
	const q = Math.floor(date.getMonth() / 3) * 3;
	return new Date(date.getFullYear(), q, 1);
}

export function resolvePeriodPreset(
	preset: StatusReportPeriodPreset,
	customFrom = '',
	customTo = '',
	now = new Date()
): { from: string; to: string; label: string } | { from: ''; to: ''; label: string } {
	const today = toDateInputValue(now);

	switch (preset) {
		case 'all':
			return { from: '', to: '', label: 'Projeto completo' };
		case 'this_week': {
			const from = toDateInputValue(startOfWeek(now));
			return { from, to: today, label: `Esta semana (${formatDate(from)} – ${formatDate(today)})` };
		}
		case 'this_month': {
			const from = toDateInputValue(new Date(now.getFullYear(), now.getMonth(), 1));
			return { from, to: today, label: `Este mês (${formatDate(from)} – ${formatDate(today)})` };
		}
		case 'last_30': {
			const fromDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29);
			const from = toDateInputValue(fromDate);
			return { from, to: today, label: `Últimos 30 dias (${formatDate(from)} – ${formatDate(today)})` };
		}
		case 'this_quarter': {
			const from = toDateInputValue(startOfQuarter(now));
			return {
				from,
				to: today,
				label: `Este trimestre (${formatDate(from)} – ${formatDate(today)})`
			};
		}
		case 'custom': {
			const from = customFrom;
			const to = customTo || today;
			if (!from) return { from: '', to: '', label: 'Período personalizado' };
			return {
				from,
				to,
				label: `Período ${formatDate(from)} – ${formatDate(to)}`
			};
		}
	}
}

export function statusLabel(status: TaskStatus) {
	return TASK_STATUS_META[status]?.label ?? status;
}

export function priorityLabel(priority: TaskPriority) {
	return TASK_PRIORITY_META[priority]?.label ?? priority;
}

export function kindLabel(kind: TaskKind) {
	return TASK_KIND_META[kind]?.label ?? kind;
}

export function slugifyFilePart(value: string) {
	return value
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '')
		.slice(0, 48);
}
