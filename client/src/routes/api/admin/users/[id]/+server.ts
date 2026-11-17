import { error, json } from '@sveltejs/kit';
import { z } from 'zod';
import { updateAdminUser, userIsSystemAdmin } from '$lib/server/admin';
import type { RequestHandler } from './$types';

const patchSchema = z
	.object({
		isActive: z.boolean(),
		plexusUserId: z.number().int().positive().nullable()
	})
	.partial()
	.refine((data) => data.isActive !== undefined || data.plexusUserId !== undefined, {
		message: 'Informe isActive e/ou plexusUserId.'
	});

/** PATCH /api/admin/users/:id — activate/inactivate + Plexus linkage (sysAdmin only). */
export const PATCH: RequestHandler = async ({ params, request, locals }) => {
	if (!locals.user) error(401, 'Não autenticado.');
	if (!(await userIsSystemAdmin(locals.user.id))) error(403, 'Acesso restrito ao system admin.');

	const parsed = patchSchema.safeParse(await request.json());
	if (!parsed.success) {
		return json({ message: 'Dados inválidos.', issues: parsed.error.issues }, { status: 400 });
	}

	const result = await updateAdminUser(params.id, parsed.data);
	if (!result.ok) {
		return json({ message: result.message }, { status: result.status });
	}

	return json({ user: result.user });
};
