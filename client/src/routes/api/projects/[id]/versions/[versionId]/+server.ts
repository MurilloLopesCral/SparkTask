import { error, json } from '@sveltejs/kit';
import { versionUpdateSchema } from '$lib/projects/schemas';
import {
	deleteProjectVersion,
	updateProjectVersion,
	userCanAccessProject,
	versionBelongsToProject
} from '$lib/server/projects';
import type { RequestHandler } from './$types';

export const PATCH: RequestHandler = async ({ params, request, locals }) => {
	if (!locals.user) error(401, 'Não autenticado.');
	if (!(await userCanAccessProject(locals.user.id, params.id)))
		error(403, 'Sem acesso a este projeto.');
	if (!(await versionBelongsToProject(params.versionId, params.id)))
		error(404, 'Versão não encontrada.');

	const parsed = versionUpdateSchema.safeParse(await request.json());
	if (!parsed.success) {
		return json({ message: 'Dados inválidos.', issues: parsed.error.issues }, { status: 400 });
	}
	if (Object.keys(parsed.data).length === 0) {
		return json({ message: 'Nada para atualizar.' }, { status: 400 });
	}

	await updateProjectVersion(params.versionId, parsed.data);
	return json({ success: true });
};

export const DELETE: RequestHandler = async ({ params, locals }) => {
	if (!locals.user) error(401, 'Não autenticado.');
	if (!(await userCanAccessProject(locals.user.id, params.id)))
		error(403, 'Sem acesso a este projeto.');
	if (!(await versionBelongsToProject(params.versionId, params.id)))
		error(404, 'Versão não encontrada.');

	const result = await deleteProjectVersion(params.id, params.versionId);
	if (!result.ok) return json({ message: result.message }, { status: 400 });
	return json({ success: true });
};
