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

export function formatDate(value: string | Date | null | undefined) {
	if (!value) return null;
	return dateFormatter.format(new Date(value));
}

export type DueDateStatus = 'overdue' | 'urgent' | 'ok';

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function startOfDay(date: Date) {
	return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function getDueDateStatus(value: string | Date | null | undefined): DueDateStatus | null {
	if (!value) return null;
	const daysLeft = Math.round(
		(startOfDay(new Date(value)).getTime() - startOfDay(new Date()).getTime()) / MS_PER_DAY
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
