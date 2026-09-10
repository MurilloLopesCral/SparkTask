import { error, json } from '@sveltejs/kit';
import { revokeInvite, userCanManageInvite } from '$lib/server/groups';
import type { RequestHandler } from './$types';

export const DELETE: RequestHandler = async ({ params, locals }) => {
	if (!locals.user) error(401, 'Não autenticado.');
	if (!(await userCanManageInvite(locals.user.id, params.inviteId)))
		error(403, 'Apenas owners do grupo.');

	await revokeInvite(params.inviteId);
	return json({ success: true });
};
