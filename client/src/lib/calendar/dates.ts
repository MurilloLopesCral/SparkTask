/** Local calendar helpers — Monday-first weeks (pt-BR). */

export function toYmd(date: Date): string {
	const y = date.getFullYear();
	const m = String(date.getMonth() + 1).padStart(2, '0');
	const d = String(date.getDate()).padStart(2, '0');
	return `${y}-${m}-${d}`;
}

export function parseYmd(ymd: string): Date {
	const [y, m, d] = ymd.split('-').map(Number);
	return new Date(y, m - 1, d);
}

export function addMonths(date: Date, delta: number): Date {
	return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}

export function addDays(date: Date, days: number): Date {
	const next = new Date(date);
	next.setDate(next.getDate() + days);
	return next;
}

/** Monday of the week containing `date`. */
export function startOfWeek(date: Date): Date {
	const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
	const iso = (d.getDay() + 6) % 7;
	d.setDate(d.getDate() - iso);
	return d;
}

export function endOfWeek(date: Date): Date {
	return addDays(startOfWeek(date), 6);
}

export function startOfMonth(date: Date): Date {
	return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function endOfMonth(date: Date): Date {
	return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

/** 42-cell month grid starting on Monday. */
export function monthGridDays(anchor: Date): Date[] {
	const first = startOfMonth(anchor);
	const gridStart = startOfWeek(first);
	return Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
}

export function weekDays(anchor: Date): Date[] {
	const start = startOfWeek(anchor);
	return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export function isSameDay(a: Date, b: Date): boolean {
	return (
		a.getFullYear() === b.getFullYear() &&
		a.getMonth() === b.getMonth() &&
		a.getDate() === b.getDate()
	);
}

export function isSameMonth(a: Date, b: Date): boolean {
	return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

export function rangeForView(mode: 'month' | 'week' | 'list', anchor: Date): { from: string; to: string } {
	if (mode === 'week') {
		return { from: toYmd(startOfWeek(anchor)), to: toYmd(endOfWeek(anchor)) };
	}
	// month + list use the visible month grid (includes leading/trailing days)
	const days = monthGridDays(anchor);
	return { from: toYmd(days[0]), to: toYmd(days[41]) };
}

export const WEEKDAY_LABELS_SHORT = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'] as const;
export const WEEKDAY_LABELS_NARROW = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'] as const;

const monthTitleFmt = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' });
const dayLongFmt = new Intl.DateTimeFormat('pt-BR', {
	weekday: 'long',
	day: 'numeric',
	month: 'long',
	year: 'numeric'
});
const dayShortFmt = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'short' });

export function formatMonthTitle(date: Date): string {
	const raw = monthTitleFmt.format(date);
	return raw.charAt(0).toUpperCase() + raw.slice(1);
}

export function formatDayLong(date: Date | string): string {
	const d = typeof date === 'string' ? parseYmd(date) : date;
	return dayLongFmt.format(d);
}

export function formatDayShort(date: Date | string): string {
	const d = typeof date === 'string' ? parseYmd(date) : date;
	return dayShortFmt.format(d);
}
