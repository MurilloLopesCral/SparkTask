import { error, json } from '@sveltejs/kit';
import { z } from 'zod';
import { versionPhaseSchema } from '$lib/projects/schemas';
import {
	createProjectVersion,
	getProjectVersions,
	userCanAccessProject
} from '$lib/server/projects';
import type { RequestHandler } from './$types';

const createVersionSchema = versionPhaseSchema.extend({
	plexusSyncEnabled: z.boolean().optional()
});

export const GET: RequestHandler = async ({ params, locals }) => {
	if (!locals.user) error(401, 'Não autenticado.');
	if (!(await userCanAccessProject(locals.user.id, params.id)))
		error(403, 'Sem acesso a este projeto.');

	const versions = await getProjectVersions(params.id);
	return json({ versions });
};

export const POST: RequestHandler = async ({ params, request, locals }) => {
	if (!locals.user) error(401, 'Não autenticado.');
	if (!(await userCanAccessProject(locals.user.id, params.id)))
		error(403, 'Sem acesso a este projeto.');

	const parsed = createVersionSchema.safeParse(await request.json().catch(() => ({})));
	if (!parsed.success) {
		return json({ message: 'Dados inválidos.', issues: parsed.error.issues }, { status: 400 });
	}

	const created = await createProjectVersion({
		projectId: params.id,
		...parsed.data
	});
	return json({ version: created }, { status: 201 });
};
