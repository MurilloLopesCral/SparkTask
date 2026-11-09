import { redirect } from '@sveltejs/kit';
import { userIsSystemAdmin } from '$lib/server/admin';
import { getUserGroups } from '$lib/server/me';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	if (!locals.user) redirect(303, '/login');

	const [groups, isSystemAdmin] = await Promise.all([
		getUserGroups(locals.user.id),
		userIsSystemAdmin(locals.user.id)
	]);

	return { user: locals.user, groups, isSystemAdmin };
};
