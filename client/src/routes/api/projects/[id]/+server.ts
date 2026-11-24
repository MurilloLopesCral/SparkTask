import { error, json } from '@sveltejs/kit';
import { z } from 'zod';
import { projectPlexusSchema } from '$lib/projects/schemas';
import { deleteProjectById, updateProjectFields, userCanAccessProject } from '$lib/server/projects';
import type { RequestHandler } from './$types';

const patchProjectSchema = z
	.object({
		name: z.string().min(1).max(255),
		description: z.string().nullable(),
		image: z.string().url().nullable()
	})
	.merge(projectPlexusSchema)
	.partial();

/** PATCH /api/projects/:id — name/description/image/plexus only (phases live on versions). */
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

	try {
		await updateProjectFields(params.id, parsed.data);
		return json({ success: true });
	} catch (err) {
		if (isUniqueViolation(err)) {
			return json({ message: 'Este ID Plexus já está em uso.' }, { status: 409 });
		}
		throw err;
	}
};

/** DELETE /api/projects/:id — cascades to every task in the project (see schema FK). */
export const DELETE: RequestHandler = async ({ params, locals }) => {
	if (!locals.user) error(401, 'Não autenticado.');
	if (!(await userCanAccessProject(locals.user.id, params.id)))
		error(403, 'Sem acesso a este projeto.');

	await deleteProjectById(params.id);
	return json({ success: true });
};

function isUniqueViolation(err: unknown) {
	return (
		typeof err === 'object' &&
		err !== null &&
		'code' in err &&
		(err as { code?: string }).code === '23505'
	);
}
