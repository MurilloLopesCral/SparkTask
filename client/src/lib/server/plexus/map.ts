export type SparkTaskStatus =
	| 'not_started'
	| 'in_progress'
	| 'stand_by'
	| 'pending_validation'
	| 'done'
	| 'cancelled';

export type PlexusGanttStatus =
	| 'NOT_STARTED'
	| 'IN_PROGRESS'
	| 'BLOCKED'
	| 'DONE'
	| 'CANCELLED';

/** Spark status → Plexus gantt status (MVP mapping). */
export function toPlexusGanttStatus(status: SparkTaskStatus): PlexusGanttStatus {
	switch (status) {
		case 'not_started':
		case 'stand_by':
			return 'NOT_STARTED';
		case 'in_progress':
		case 'pending_validation':
			return 'IN_PROGRESS';
		case 'done':
			return 'DONE';
		case 'cancelled':
			return 'CANCELLED';
	}
}

/** Rough progress for Plexus percentComplete (0–100). */
export function toPercentComplete(status: SparkTaskStatus): number {
	switch (status) {
		case 'not_started':
		case 'stand_by':
			return 0;
		case 'in_progress':
			return 40;
		case 'pending_validation':
			return 80;
		case 'done':
			return 100;
		case 'cancelled':
			return 0;
	}
}

export function toYmd(date: Date) {
	const y = date.getFullYear();
	const m = String(date.getMonth() + 1).padStart(2, '0');
	const d = String(date.getDate()).padStart(2, '0');
	return `${y}-${m}-${d}`;
}

/** start/end for CreateGantt — end falls back to start when no due date. */
export function ganttDateWindow(dueDate: string | null, createdAt: Date) {
	const startDate = toYmd(createdAt);
	const endDate = dueDate && /^\d{4}-\d{2}-\d{2}$/.test(dueDate) ? dueDate : startDate;
	return { startDate, endDate };
}

export function parsePlexusProjectId(raw: string | null | undefined): number | null {
	if (!raw?.trim()) return null;
	const n = Number(raw.trim());
	return Number.isFinite(n) ? n : null;
}
