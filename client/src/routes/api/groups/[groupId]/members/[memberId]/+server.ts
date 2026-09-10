import { error, json } from '@sveltejs/kit';
import {
	countGroupOwners,
	getGroupMemberRole,
	removeMember,
	userIsGroupOwner
} from '$lib/server/groups';
import type { RequestHandler } from './$types';

export const DELETE: RequestHandler = async ({ params, locals }) => {
	if (!locals.user) error(401, 'Não autenticado.');
	if (!(await userIsGroupOwner(locals.user.id, params.groupId))) {
		error(403, 'Apenas owners do grupo.');
	}
	if (params.memberId === locals.user.id) {
		return json({ message: 'Você não pode remover a si mesmo.' }, { status: 400 });
	}

	const role = await getGroupMemberRole(params.groupId, params.memberId);
	if (!role) error(404, 'Membro não encontrado.');

	if (role === 'owner' && (await countGroupOwners(params.groupId)) <= 1) {
		return json({ message: 'Não é possível remover o único owner do grupo.' }, { status: 400 });
	}

	await removeMember(params.groupId, params.memberId);
	return json({ success: true });
};
