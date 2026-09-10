import type { taskPriorityEnum, taskStatusEnum, taskTypeEnum } from '$lib/server/db/schema';

export type TaskStatus = (typeof taskStatusEnum.enumValues)[number];
export type TaskPriority = (typeof taskPriorityEnum.enumValues)[number];
export type TaskType = (typeof taskTypeEnum.enumValues)[number];

// Column/board order — also the sort priority when grouping by status.
export const TASK_STATUSES: { value: TaskStatus; label: string; badgeClass: string }[] = [
	{ value: 'not_started', label: 'Não iniciada', badgeClass: 'bg-tint-steel text-ink' },
	{ value: 'in_progress', label: 'Em andamento', badgeClass: 'bg-tint-sky text-ink' },
	{ value: 'stand_by', label: 'Em espera', badgeClass: 'bg-tint-peach text-ink' },
	{ value: 'done', label: 'Concluída', badgeClass: 'bg-tint-sage text-ink' },
	{ value: 'cancelled', label: 'Cancelada', badgeClass: 'bg-dell-red text-on-red' }
];

export const TASK_STATUS_META = Object.fromEntries(
	TASK_STATUSES.map((s) => [s.value, s])
) as Record<TaskStatus, (typeof TASK_STATUSES)[number]>;

export const TASK_PRIORITIES: { value: TaskPriority; label: string }[] = [
	{ value: 'low', label: 'Baixa' },
	{ value: 'medium', label: 'Média' },
	{ value: 'high', label: 'Alta' },
	{ value: 'critical', label: 'Crítica' }
];

export const TASK_PRIORITY_META = Object.fromEntries(
	TASK_PRIORITIES.map((p) => [p.value, p])
) as Record<TaskPriority, (typeof TASK_PRIORITIES)[number]>;

export const TASK_TYPES: { value: TaskType; label: string }[] = [
	{ value: 'mandatory', label: 'Obrigatória' },
	{ value: 'optional', label: 'Opcional' },
	{ value: 'desirable', label: 'Desejável' }
];

export const TASK_TYPE_META = Object.fromEntries(TASK_TYPES.map((t) => [t.value, t])) as Record<
	TaskType,
	(typeof TASK_TYPES)[number]
>;
