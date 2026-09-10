import { error, json } from '@sveltejs/kit';
import { z } from 'zod';
import { createProject, getVisibleProjects, userCanAccessGroup } from '$lib/server/projects';
import type { RequestHandler } from './$types';

const createProjectSchema = z.object({
	name: z.string().min(1).max(255),
	description: z.string().optional(),
	groupId: z.string().uuid()
});

export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) error(401, 'Não autenticado.');

	const projects = await getVisibleProjects(locals.user.id);
	return json({ projects });
};

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) error(401, 'Não autenticado.');

	const parsed = createProjectSchema.safeParse(await request.json());
	if (!parsed.success) {
		return json({ message: 'Dados inválidos.', issues: parsed.error.issues }, { status: 400 });
	}

	if (!(await userCanAccessGroup(locals.user.id, parsed.data.groupId))) {
		return json({ message: 'Você não tem acesso a este grupo.' }, { status: 403 });
	}

	const created = await createProject({
		name: parsed.data.name,
		description: parsed.data.description || null,
		groupId: parsed.data.groupId
	});

	return json({ project: created }, { status: 201 });
};
