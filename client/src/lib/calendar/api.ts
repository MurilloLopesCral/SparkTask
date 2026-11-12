import type { CalendarEvent } from './types';

export async function fetchCalendarEvents(params: {
	groupId: string;
	from: string;
	to: string;
	userId?: string;
	projectId?: string;
}): Promise<{ ok: true; events: CalendarEvent[] } | { ok: false; message: string }> {
	const qs = new URLSearchParams({
		groupId: params.groupId,
		from: params.from,
		to: params.to
	});
	if (params.userId) qs.set('userId', params.userId);
	if (params.projectId) qs.set('projectId', params.projectId);

	const res = await fetch(`/api/calendar?${qs}`);
	const data = await res.json().catch(() => ({}));
	if (!res.ok) {
		return { ok: false, message: data.message ?? 'Não foi possível carregar o calendário.' };
	}
	return { ok: true, events: data.events as CalendarEvent[] };
}
