import { error } from '@sveltejs/kit';
import { listAllGroups, listUsersForOwnerPicker, userIsSystemAdmin } from '$lib/server/admin';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) error(401, 'Não autenticado.');
	if (!(await userIsSystemAdmin(locals.user.id))) {
		error(403, 'Acesso restrito ao system admin.');
	}

	const [groups, users] = await Promise.all([listAllGroups(), listUsersForOwnerPicker()]);
	return { groups, users };
};
