export type CalendarEventKind = 'task' | 'ghost';

export type CalendarEvent = {
	id: string;
	kind: CalendarEventKind;
	title: string;
	description: string | null;
	date: string;
	priority: string;
	type: string;
	status: string | null;
	projectId: string;
	projectName: string;
	groupId: string;
	ownerId: string | null;
	ownerName: string | null;
	taskId: string | null;
	recurrenceId: string | null;
};

export type CalendarViewMode = 'month' | 'week' | 'list';
