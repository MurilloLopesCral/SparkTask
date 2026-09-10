import { error, json } from '@sveltejs/kit';
import { z } from 'zod';
import { deleteProjectById, updateProjectFields, userCanAccessProject } from '$lib/server/projects';
import type { RequestHandler } from './$types';

const patchProjectSchema = z
	.object({
		name: z.string().min(1).max(255),
		description: z.string().nullable()
	})
	.partial();

/** PATCH /api/projects/:id — partial update, single endpoint for every editable field. */
export const PATCH: RequestHandler = async ({ params, request, locals }) => {
	if (!locals.user) error(401, 'Não autenticado.');
	if (!(await userCanAccessProject(locals.user.id, params.id)))
		error(403, 'Sem acesso a este projeto.');

	const parsed = patchProjectSchema.safeParse(await request.json());
	if (!parsed.success) {
		return json({ message: 'Dados inválidos.', issues: parsed.error.issues }, { status: 400 });
	}
	if (Object.keys(parsed.data).length === 0) {
		return json({ message: 'Nada para atualizar.' }, { status: 400 });
	}

	await updateProjectFields(params.id, parsed.data);
	return json({ success: true });
};

/** DELETE /api/projects/:id — cascades to every task in the project (see schema FK). */
export const DELETE: RequestHandler = async ({ params, locals }) => {
	if (!locals.user) error(401, 'Não autenticado.');
	if (!(await userCanAccessProject(locals.user.id, params.id)))
		error(403, 'Sem acesso a este projeto.');

	await deleteProjectById(params.id);
	return json({ success: true });
};
