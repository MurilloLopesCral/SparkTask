export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly';
export type DueOffsetMode = 'same_day' | 'after_days' | 'after_business_days';

export const RECURRENCE_FREQUENCIES: { value: RecurrenceFrequency; label: string }[] = [
	{ value: 'daily', label: 'Diária' },
	{ value: 'weekly', label: 'Semanal' },
	{ value: 'monthly', label: 'Mensal' }
];

export const DUE_OFFSET_MODES: { value: DueOffsetMode; label: string; hint: string }[] = [
	{
		value: 'same_day',
		label: 'Mesmo dia da criação',
		hint: 'O prazo é a data em que a tarefa é gerada.'
	},
	{
		value: 'after_days',
		label: 'Dias após a criação',
		hint: 'Conta dias corridos a partir da ocorrência.'
	},
	{
		value: 'after_business_days',
		label: 'Dias úteis após a criação',
		hint: 'Ignora sábados e domingos.'
	}
];

export const WEEKDAY_OPTIONS: {
	value: number;
	label: string;
	short: string;
	full: string;
}[] = [
	{ value: 1, label: 'Segunda', short: 'Seg', full: 'segunda-feira' },
	{ value: 2, label: 'Terça', short: 'Ter', full: 'terça-feira' },
	{ value: 3, label: 'Quarta', short: 'Qua', full: 'quarta-feira' },
	{ value: 4, label: 'Quinta', short: 'Qui', full: 'quinta-feira' },
	{ value: 5, label: 'Sexta', short: 'Sex', full: 'sexta-feira' },
	{ value: 6, label: 'Sábado', short: 'Sáb', full: 'sábado' },
	{ value: 7, label: 'Domingo', short: 'Dom', full: 'domingo' }
];

function capitalize(value: string) {
	return value.charAt(0).toUpperCase() + value.slice(1);
}

/** Human summary for cards — e.g. "Toda sexta-feira", "Todos os dias úteis". */
export function formatRecurrenceRule(row: {
	frequency: RecurrenceFrequency;
	weekdaysOnly: boolean;
	weekDays: number[] | null;
	dayOfMonth: number | null;
}): string {
	if (row.frequency === 'daily') {
		return row.weekdaysOnly ? 'Todos os dias úteis' : 'Todos os dias';
	}

	if (row.frequency === 'weekly') {
		const days = WEEKDAY_OPTIONS.filter((d) => (row.weekDays ?? []).includes(d.value));
		if (days.length === 0) return 'Semanal';
		if (days.length === 1) return `Toda ${days[0].full}`;
		if (days.length === 2) {
			return `Toda ${days[0].full} e ${days[1].full}`;
		}
		const head = days.slice(0, -1).map((d) => d.short);
		const last = days[days.length - 1].short;
		return `Toda semana: ${head.join(', ')} e ${last}`;
	}

	const day = row.dayOfMonth ?? 1;
	return `Todo dia ${day} do mês`;
}

export function formatRecurrenceTitleCase(row: Parameters<typeof formatRecurrenceRule>[0]) {
	return capitalize(formatRecurrenceRule(row));
}

export function formatDueOffset(row: {
	dueOffsetMode?: DueOffsetMode | null;
	dueOffsetDays?: number | null;
}): string {
	const mode = row.dueOffsetMode ?? 'same_day';
	const days = row.dueOffsetDays ?? 0;
	if (mode === 'same_day' || days <= 0) return 'Prazo no mesmo dia';
	if (mode === 'after_business_days') {
		return days === 1 ? 'Prazo em 1 dia útil' : `Prazo em ${days} dias úteis`;
	}
	return days === 1 ? 'Prazo em 1 dia' : `Prazo em ${days} dias`;
}
