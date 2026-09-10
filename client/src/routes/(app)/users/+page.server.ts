import { error } from '@sveltejs/kit';
import { getGroupMembers, getOwnedGroups, getPendingInvites } from '$lib/server/groups';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const ownedGroups = await getOwnedGroups(locals.user!.id);
	if (ownedGroups.length === 0) {
		error(403, 'Só quem é owner de um grupo pode acessar esta página.');
	}

	const requestedGroupId = url.searchParams.get('group');
	const selectedGroup = ownedGroups.find((g) => g.id === requestedGroupId) ?? ownedGroups[0];

	const [members, invites] = await Promise.all([
		getGroupMembers(selectedGroup.id),
		getPendingInvites(selectedGroup.id)
	]);

	return { ownedGroups, selectedGroupId: selectedGroup.id, members, invites };
};
