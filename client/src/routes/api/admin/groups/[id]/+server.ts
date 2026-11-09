import { error, json } from '@sveltejs/kit';
import { z } from 'zod';
import { setGroupActive, userIsSystemAdmin } from '$lib/server/admin';
import type { RequestHandler } from './$types';

const patchSchema = z.object({
	isActive: z.boolean()
});

export const PATCH: RequestHandler = async ({ request, locals, params }) => {
	if (!locals.user) error(401, 'Não autenticado.');
	if (!(await userIsSystemAdmin(locals.user.id))) error(403, 'Acesso restrito ao system admin.');

	const parsed = patchSchema.safeParse(await request.json());
	if (!parsed.success) {
		return json({ message: 'Dados inválidos.', issues: parsed.error.issues }, { status: 400 });
	}

	const result = await setGroupActive(params.id, parsed.data.isActive);
	if (!result.ok) {
		return json({ message: result.message }, { status: result.status });
	}

	return json({ group: result.group });
};
