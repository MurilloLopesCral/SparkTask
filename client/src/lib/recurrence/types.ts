import type { DueOffsetMode, RecurrenceFrequency } from './constants';

export type RecurrenceRow = {
	id: string;
	title: string;
	description: string | null;
	projectId: string;
	priority: string;
	type: string;
	kind: string;
	ownerId: string | null;
	frequency: RecurrenceFrequency;
	weekdaysOnly: boolean;
	weekDays: number[] | null;
	dayOfMonth: number | null;
	nextDueDate: string;
	dueOffsetMode: DueOffsetMode;
	dueOffsetDays: number;
	enabled: boolean;
	project?: { id: string; name: string; groupId: string } | null;
	owner?: { id: string; name: string | null; email: string } | null;
};
