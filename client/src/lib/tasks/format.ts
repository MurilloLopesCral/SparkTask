export function formatFileSize(bytes: number) {
	if (bytes < 1024) return `${bytes} B`;
	const units = ['KB', 'MB', 'GB'];
	let value = bytes / 1024;
	let unitIndex = 0;
	while (value >= 1024 && unitIndex < units.length - 1) {
		value /= 1024;
		unitIndex++;
	}
	return `${value.toFixed(value < 10 ? 1 : 0)} ${units[unitIndex]}`;
}

const dateFormatter = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' });

/** Date-only ISO (`YYYY-MM-DD`) is UTC midnight in `new Date()` — west of UTC that becomes the previous local day. */
function toLocalDate(value: string | Date) {
	if (value instanceof Date) {
		return new Date(value.getFullYear(), value.getMonth(), value.getDate());
	}
	const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
	if (match) {
		return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
	}
	const parsed = new Date(value);
	return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
}

export function formatDate(value: string | Date | null | undefined) {
	if (!value) return null;
	return dateFormatter.format(toLocalDate(value));
}

const dateTimeFormatter = new Intl.DateTimeFormat('pt-BR', {
	dateStyle: 'short',
	timeStyle: 'short'
});

export function formatDateTime(value: string | Date | null | undefined) {
	if (!value) return null;
	return dateTimeFormatter.format(value instanceof Date ? value : new Date(value));
}

/** Human-readable duration from seconds (e.g. `1h 12min`, `5min 3s`). */
export function formatDuration(totalSeconds: number) {
	const seconds = Math.max(0, Math.floor(totalSeconds));
	const hours = Math.floor(seconds / 3600);
	const minutes = Math.floor((seconds % 3600) / 60);
	const secs = seconds % 60;
	if (hours > 0) return `${hours}h ${minutes}min`;
	if (minutes > 0) return secs > 0 ? `${minutes}min ${secs}s` : `${minutes}min`;
	return `${secs}s`;
}

export type DueDateStatus = 'overdue' | 'urgent' | 'ok';

const MS_PER_DAY = 1000 * 60 * 60 * 24;

export function getDueDateStatus(value: string | Date | null | undefined): DueDateStatus | null {
	if (!value) return null;
	const daysLeft = Math.round(
		(toLocalDate(value).getTime() - toLocalDate(new Date()).getTime()) / MS_PER_DAY
	);
	if (daysLeft < 0) return 'overdue';
	if (daysLeft <= 10) return 'urgent';
	return 'ok';
}

const DUE_DATE_STATUS_CLASSES: Record<DueDateStatus, string> = {
	overdue: 'text-dell-red',
	urgent: 'text-tint-olive',
	ok: 'text-tint-sage'
};

export function dueDateStatusClass(value: string | Date | null | undefined) {
	const status = getDueDateStatus(value);
	return status ? DUE_DATE_STATUS_CLASSES[status] : '';
}
