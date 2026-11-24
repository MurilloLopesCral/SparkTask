/** Monthly roadmap helpers for the project calendar (Gantt). */

export type ProjectPhaseKey = 'implementation' | 'assistedOps' | 'performance';

export type ProjectPhase = {
	key: ProjectPhaseKey;
	label: string;
	shortLabel: string;
	/** Noun used in hover tooltips, e.g. "Implementação". */
	hoverLabel: string;
	/** Tailwind tint classes for the bar. */
	barClass: string;
	start: string | null;
	end: string | null;
};

export type RoadmapProject = {
	/** Version id (one Gantt row per version). */
	id: string;
	projectId: string;
	name: string;
	/** Project name without version suffix — for tooltips. */
	projectName: string;
	groupId: string;
	plexusProjectId: string | null;
	implementationStart: string | null;
	implementationEnd: string | null;
	assistedOpsStart: string | null;
	assistedOpsEnd: string | null;
	performanceStart: string | null;
	performanceEnd: string | null;
};

export type MonthColumn = {
	key: string;
	year: number;
	month: number;
	label: string;
};

const monthFmt = new Intl.DateTimeFormat('pt-BR', { month: 'short' });

export function phasesForProject(project: RoadmapProject): ProjectPhase[] {
	return [
		{
			key: 'implementation',
			label: 'Implementação',
			shortLabel: 'Impl.',
			hoverLabel: 'Implementação',
			barClass: 'bg-tint-sky text-ink',
			start: project.implementationStart,
			end: project.implementationEnd
		},
		{
			key: 'assistedOps',
			label: 'QO — Operação assistida',
			shortLabel: 'QO',
			hoverLabel: 'Monitoramento',
			barClass: 'bg-tint-peach text-ink',
			start: project.assistedOpsStart,
			end: project.assistedOpsEnd
		},
		{
			key: 'performance',
			label: 'QP — Desempenho',
			shortLabel: 'QP',
			hoverLabel: 'Desempenho',
			barClass: 'bg-tint-sage text-ink',
			start: project.performanceStart,
			end: project.performanceEnd
		}
	];
}

export function phaseHoverTitle(phase: ProjectPhase, projectName: string) {
	return `${phase.hoverLabel} do projeto ${projectName}`;
}

function parseYm(ymd: string): { year: number; month: number } | null {
	const match = /^(\d{4})-(\d{2})/.exec(ymd);
	if (!match) return null;
	return { year: Number(match[1]), month: Number(match[2]) };
}

function monthIndex(year: number, month: number) {
	return year * 12 + (month - 1);
}

function fromMonthIndex(index: number): { year: number; month: number } {
	const year = Math.floor(index / 12);
	const month = (index % 12) + 1;
	return { year, month };
}

/** Inclusive month span for a phase (missing end → same as start). */
export function phaseMonthSpan(start: string | null, end: string | null) {
	if (!start && !end) return null;
	const a = parseYm(start ?? end!);
	const b = parseYm(end ?? start!);
	if (!a || !b) return null;
	const from = Math.min(monthIndex(a.year, a.month), monthIndex(b.year, b.month));
	const to = Math.max(monthIndex(a.year, a.month), monthIndex(b.year, b.month));
	return { from, to };
}

export function buildMonthColumns(projects: RoadmapProject[], fallbackYear: number): MonthColumn[] {
	let min = monthIndex(fallbackYear, 1);
	let max = monthIndex(fallbackYear, 12);
	let found = false;

	for (const project of projects) {
		for (const phase of phasesForProject(project)) {
			const span = phaseMonthSpan(phase.start, phase.end);
			if (!span) continue;
			if (!found) {
				min = span.from;
				max = span.to;
				found = true;
			} else {
				min = Math.min(min, span.from);
				max = Math.max(max, span.to);
			}
		}
	}

	// Keep a readable window — pad one month on each side when we have data.
	if (found) {
		min -= 0;
		max += 0;
	}

	const columns: MonthColumn[] = [];
	for (let i = min; i <= max; i++) {
		const { year, month } = fromMonthIndex(i);
		const labelDate = new Date(year, month - 1, 1);
		const raw = monthFmt.format(labelDate).replace('.', '');
		columns.push({
			key: `${year}-${String(month).padStart(2, '0')}`,
			year,
			month,
			label: `${raw.charAt(0).toUpperCase()}${raw.slice(1)}/${String(year).slice(2)}`
		});
	}
	return columns;
}

export function phaseBarPlacement(
	phase: ProjectPhase,
	columns: MonthColumn[]
): { startCol: number; span: number } | null {
	if (columns.length === 0) return null;
	const span = phaseMonthSpan(phase.start, phase.end);
	if (!span) return null;

	const first = monthIndex(columns[0].year, columns[0].month);
	const last = monthIndex(columns[columns.length - 1].year, columns[columns.length - 1].month);
	const from = Math.max(span.from, first);
	const to = Math.min(span.to, last);
	if (from > to) return null;

	return {
		startCol: from - first + 1,
		span: to - from + 1
	};
}

/** Count of versions with any phase active in each month column. */
export function activeProjectsPerMonth(projects: RoadmapProject[], columns: MonthColumn[]) {
	return columns.map((col) => {
		const idx = monthIndex(col.year, col.month);
		let count = 0;
		for (const project of projects) {
			const active = phasesForProject(project).some((phase) => {
				const span = phaseMonthSpan(phase.start, phase.end);
				return span !== null && idx >= span.from && idx <= span.to;
			});
			if (active) count += 1;
		}
		return count;
	});
}

/** Peak load across the visible window — for the Gantt footer summary. */
export function peakActiveMonth(counts: number[], columns: MonthColumn[]) {
	if (counts.length === 0 || columns.length === 0) return null;
	let peak = 0;
	let index = 0;
	for (let i = 0; i < counts.length; i++) {
		if (counts[i] > peak) {
			peak = counts[i];
			index = i;
		}
	}
	if (peak === 0) return null;
	return { count: peak, column: columns[index] };
}

/**
 * Heat intensity 0–1 for footer cells (0 = idle, 1 = peak of the window).
 * CSS uses this via color-mix on the peach tint.
 */
export function monthHeatRatio(count: number, peak: number) {
	if (count <= 0 || peak <= 0) return 0;
	return Math.min(1, count / peak);
}

export function projectHasRoadmapDates(project: RoadmapProject) {
	return phasesForProject(project).some((p) => p.start || p.end);
}
