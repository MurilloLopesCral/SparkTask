import { error, json } from '@sveltejs/kit';
import { pauseAllOpenExecutionsForUser } from '$lib/server/executions';
import type { RequestHandler } from './$types';

/** POST /api/executions/pause-all — pause every open execution for the caller. */
export const POST: RequestHandler = async ({ locals }) => {
	if (!locals.user) error(401, 'Não autenticado.');

	const result = await pauseAllOpenExecutionsForUser(locals.user.id);
	return json({ success: true, paused: result.paused, taskIds: result.taskIds });
};
