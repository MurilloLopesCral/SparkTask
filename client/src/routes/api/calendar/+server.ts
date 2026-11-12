import { error, json } from '@sveltejs/kit';
import { z } from 'zod';
import { getCalendarEvents } from '$lib/server/calendar';
import type { RequestHandler } from './$types';

const querySchema = z.object({
	groupId: z.string().uuid(),
	from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
	to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
	userId: z.string().uuid().optional(),
	projectId: z.string().uuid().optional()
});

/**
 * GET /api/calendar?groupId=&from=&to=&userId=&projectId=
 * Returns concrete tasks + ghost recurrence occurrences in the range.
 */
export const GET: RequestHandler = async ({ url, locals }) => {
	if (!locals.user) error(401, 'Não autenticado.');

	const parsed = querySchema.safeParse({
		groupId: url.searchParams.get('groupId'),
		from: url.searchParams.get('from'),
		to: url.searchParams.get('to'),
		userId: url.searchParams.get('userId') || undefined,
		projectId: url.searchParams.get('projectId') || undefined
	});
	if (!parsed.success) {
		return json({ message: 'Parâmetros inválidos.', issues: parsed.error.issues }, { status: 400 });
	}
	if (parsed.data.from > parsed.data.to) {
		return json({ message: 'O intervalo from/to é inválido.' }, { status: 400 });
	}

	const result = await getCalendarEvents(locals.user.id, parsed.data);
	if (!result.ok) {
		return json({ message: result.message }, { status: result.status });
	}

	return json({ events: result.events });
};
