import { error, json } from '@sveltejs/kit';
import {
	listUsersForAdmin,
	listUsersForOwnerPicker,
	userIsSystemAdmin
} from '$lib/server/admin';
import type { RequestHandler } from './$types';

/**
 * GET /api/admin/users
 *   ?scope=picker  → active users for create-group owner select
 *   (default)      → full directory for the Usuários tab
 */
export const GET: RequestHandler = async ({ locals, url }) => {
	if (!locals.user) error(401, 'Não autenticado.');
	if (!(await userIsSystemAdmin(locals.user.id))) error(403, 'Acesso restrito ao system admin.');

	if (url.searchParams.get('scope') === 'picker') {
		const users = await listUsersForOwnerPicker();
		return json({ users });
	}

	const users = await listUsersForAdmin();
	return json({ users });
};
