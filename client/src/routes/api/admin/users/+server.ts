import { error, json } from '@sveltejs/kit';
import { listUsersForOwnerPicker, userIsSystemAdmin } from '$lib/server/admin';
import type { RequestHandler } from './$types';

/** Active users for the create-group owner picker. */
export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) error(401, 'Não autenticado.');
	if (!(await userIsSystemAdmin(locals.user.id))) error(403, 'Acesso restrito ao system admin.');

	const users = await listUsersForOwnerPicker();
	return json({ users });
};
