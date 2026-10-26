/** Shared work-schedule types & defaults (client + server). */

export const WORK_SCHEDULE_TIMEZONE = 'America/Sao_Paulo';

/** ISO weekdays: 1=Mon … 7=Sun */
export const WORK_WEEKDAYS: { value: number; label: string; short: string }[] = [
	{ value: 1, label: 'Segunda', short: 'Seg' },
	{ value: 2, label: 'Terça', short: 'Ter' },
	{ value: 3, label: 'Quarta', short: 'Qua' },
	{ value: 4, label: 'Quinta', short: 'Qui' },
	{ value: 5, label: 'Sexta', short: 'Sex' },
	{ value: 6, label: 'Sábado', short: 'Sáb' },
	{ value: 7, label: 'Domingo', short: 'Dom' }
];

export type WorkSchedule = {
	enabled: boolean;
	timezone: string;
	workDays: number[];
	startTime: string;
	endTime: string;
};

export const DEFAULT_WORK_SCHEDULE: WorkSchedule = {
	enabled: true,
	timezone: WORK_SCHEDULE_TIMEZONE,
	workDays: [1, 2, 3, 4, 5],
	startTime: '08:00',
	endTime: '18:00'
};

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function isValidTimeHHmm(value: string) {
	return TIME_RE.test(value);
}

export function timeToMinutes(value: string): number | null {
	if (!isValidTimeHHmm(value)) return null;
	const [h, m] = value.split(':').map(Number);
	return h * 60 + m;
}
