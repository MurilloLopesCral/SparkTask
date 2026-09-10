import { error, json } from '@sveltejs/kit';
import { getUserGroups } from '$lib/server/me';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) error(401, 'Not authenticated');

	const groups = await getUserGroups(locals.user.id);

	return json({
		user: {
			id: locals.user.id,
			name: locals.user.name,
			email: locals.user.email
		},
		groups
	});
};
