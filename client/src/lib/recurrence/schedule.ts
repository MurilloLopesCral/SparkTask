/** Date helpers as YYYY-MM-DD calendar strings (no TZ conversion in parsing). */

export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly';

export type RecurrenceRule = {
	frequency: RecurrenceFrequency;
	weekdaysOnly?: boolean;
	/** ISO 1=Mon … 7=Sun */
	weekDays?: number[];
	dayOfMonth?: number | null;
};

export function todayInTimeZone(timeZone = 'America/Sao_Paulo'): string {
	return new Intl.DateTimeFormat('en-CA', {
		timeZone,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit'
	}).format(new Date());
}

export function parseDateOnly(value: string): { y: number; m: number; d: number } {
	const [y, m, d] = value.split('-').map(Number);
	return { y, m, d };
}

export function formatDateOnly(y: number, m: number, d: number): string {
	return `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

/** JS getDay(): 0=Sun … 6=Sat → ISO 1=Mon … 7=Sun */
export function isoWeekdayFromYmd(ymd: string): number {
	const { y, m, d } = parseDateOnly(ymd);
	const js = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
	return js === 0 ? 7 : js;
}

export function addDays(ymd: string, days: number): string {
	const { y, m, d } = parseDateOnly(ymd);
	const dt = new Date(Date.UTC(y, m - 1, d + days));
	return formatDateOnly(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate());
}

export function daysInMonth(y: number, m: number): number {
	return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

export function clampDayOfMonth(y: number, m: number, dayOfMonth: number): number {
	return Math.min(Math.max(1, dayOfMonth), daysInMonth(y, m));
}

export function compareYmd(a: string, b: string): number {
	return a < b ? -1 : a > b ? 1 : 0;
}

export function matchesRule(ymd: string, rule: RecurrenceRule): boolean {
	const iso = isoWeekdayFromYmd(ymd);
	if (rule.frequency === 'daily') {
		if (rule.weekdaysOnly && iso >= 6) return false;
		return true;
	}
	if (rule.frequency === 'weekly') {
		const days = rule.weekDays?.length ? rule.weekDays : [];
		return days.includes(iso);
	}
	// monthly
	const { y, m, d } = parseDateOnly(ymd);
	const target = clampDayOfMonth(y, m, rule.dayOfMonth ?? 1);
	return d === target;
}

/** First matching date on or after `from` (inclusive). */
export function nextOccurrenceOnOrAfter(from: string, rule: RecurrenceRule): string {
	let cursor = from;
	for (let i = 0; i < 400; i++) {
		if (matchesRule(cursor, rule)) return cursor;
		cursor = addDays(cursor, 1);
	}
	return from;
}

/** Strictly after `after`. */
export function nextOccurrenceAfter(after: string, rule: RecurrenceRule): string {
	return nextOccurrenceOnOrAfter(addDays(after, 1), rule);
}

/** Expand ghost dates in [from, to] inclusive. */
export function expandOccurrences(from: string, to: string, rule: RecurrenceRule): string[] {
	const out: string[] = [];
	let cursor = nextOccurrenceOnOrAfter(from, rule);
	while (compareYmd(cursor, to) <= 0) {
		out.push(cursor);
		cursor = nextOccurrenceAfter(cursor, rule);
		if (out.length > 400) break;
	}
	return out;
}

export type DueOffsetMode = 'same_day' | 'after_days' | 'after_business_days';

export type DueOffsetRule = {
	mode: DueOffsetMode;
	days: number;
};

/** Calendar lookback so due dates in [from,to] include earlier occurrences. */
export function dueOffsetLookbackDays(rule: DueOffsetRule): number {
	const days = Math.max(0, Math.min(90, rule.days || 0));
	if (rule.mode === 'same_day' || days === 0) return 0;
	// Business days need extra calendar padding for weekends.
	if (rule.mode === 'after_business_days') return Math.ceil(days * 1.6) + 7;
	return days;
}

/** Deadline derived from the occurrence (spawn) date. */
export function computeDueDate(occurrenceYmd: string, rule: DueOffsetRule): string {
	const days = Math.max(0, Math.min(90, rule.days || 0));
	if (rule.mode === 'same_day' || days === 0) return occurrenceYmd;

	if (rule.mode === 'after_days') return addDays(occurrenceYmd, days);

	let cursor = occurrenceYmd;
	let remaining = days;
	let guard = 0;
	while (remaining > 0 && guard < 400) {
		cursor = addDays(cursor, 1);
		if (isoWeekdayFromYmd(cursor) <= 5) remaining -= 1;
		guard += 1;
	}
	return cursor;
}

export function normalizeDueOffset(
	mode: DueOffsetMode | undefined,
	days: number | undefined
): DueOffsetRule {
	const resolvedMode = mode ?? 'same_day';
	if (resolvedMode === 'same_day') return { mode: 'same_day', days: 0 };
	const n = Math.trunc(days ?? 0);
	return { mode: resolvedMode, days: Math.min(90, Math.max(1, n || 1)) };
}
