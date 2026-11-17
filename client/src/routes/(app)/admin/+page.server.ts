import { error } from '@sveltejs/kit';
import {
	listAllGroups,
	listUsersForAdmin,
	listUsersForOwnerPicker,
	userIsSystemAdmin
} from '$lib/server/admin';
import { isPlexusConfigured } from '$lib/server/plexus/config';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	if (!locals.user) error(401, 'Não autenticado.');
	if (!(await userIsSystemAdmin(locals.user.id))) {
		error(403, 'Acesso restrito ao system admin.');
	}

	const tabParam = url.searchParams.get('tab');
	const tab = tabParam === 'users' ? ('users' as const) : ('groups' as const);

	const [groups, ownerPickerUsers, users] = await Promise.all([
		listAllGroups(),
		listUsersForOwnerPicker(),
		listUsersForAdmin()
	]);

	return {
		tab,
		groups,
		users: ownerPickerUsers,
		directory: users,
		plexusReady: isPlexusConfigured()
	};
};
