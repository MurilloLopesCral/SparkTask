import { redirect } from '@sveltejs/kit';
import { getUserGroups } from '$lib/server/me';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	if (!locals.user) redirect(303, '/login');

	const groups = await getUserGroups(locals.user.id);

	return { user: locals.user, groups };
};
