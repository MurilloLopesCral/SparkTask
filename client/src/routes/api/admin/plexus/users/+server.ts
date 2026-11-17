import { error, json } from '@sveltejs/kit';
import { userIsSystemAdmin } from '$lib/server/admin';
import { isPlexusConfigured } from '$lib/server/plexus/config';
import { PlexusApiError, searchPlexusUsers } from '$lib/server/plexus/client';
import type { RequestHandler } from './$types';

/** GET /api/admin/plexus/users?q= — proxy search for Plexus users (sysAdmin + users:read). */
export const GET: RequestHandler = async ({ locals, url }) => {
	if (!locals.user) error(401, 'Não autenticado.');
	if (!(await userIsSystemAdmin(locals.user.id))) error(403, 'Acesso restrito ao system admin.');

	if (!isPlexusConfigured()) {
		return json(
			{ message: 'Plexus não configurado (PLEXUS_API_BASE_URL / PLEXUS_SERVICE_KEY).' },
			{ status: 503 }
		);
	}

	const q = url.searchParams.get('q') ?? '';
	try {
		const users = await searchPlexusUsers(q, 25);
		return json({ users });
	} catch (err) {
		if (err instanceof PlexusApiError) {
			return json(
				{ message: 'Falha ao consultar usuários no Plexus.', detail: err.body },
				{ status: err.status >= 400 && err.status < 600 ? err.status : 502 }
			);
		}
		throw err;
	}
};
