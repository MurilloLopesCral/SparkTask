import { error, json } from '@sveltejs/kit';
import { z } from 'zod';
import { projectLifecycleSchema } from '$lib/projects/schemas';
import { createProject, getVisibleProjects, userCanAccessGroup } from '$lib/server/projects';
import type { RequestHandler } from './$types';

const createProjectSchema = z
	.object({
		name: z.string().min(1).max(255),
		description: z.string().optional(),
		groupId: z.string().uuid()
	})
	.merge(projectLifecycleSchema);

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

	const {
		name,
		description,
		groupId,
		plexusProjectId,
		plexusTopicCode,
		implementationStart,
		implementationEnd,
		assistedOpsStart,
		assistedOpsEnd,
		performanceStart,
		performanceEnd
	} = parsed.data;

	try {
		const created = await createProject({
			name,
			description: description || null,
			groupId,
			plexusProjectId,
			plexusTopicCode,
			implementationStart,
			implementationEnd,
			assistedOpsStart,
			assistedOpsEnd,
			performanceStart,
			performanceEnd
		});
		return json({ project: created }, { status: 201 });
	} catch (err) {
		if (isUniqueViolation(err)) {
			return json({ message: 'Este ID Plexus já está em uso.' }, { status: 409 });
		}
		throw err;
	}
};

function isUniqueViolation(err: unknown) {
	return (
		typeof err === 'object' &&
		err !== null &&
		'code' in err &&
		(err as { code?: string }).code === '23505'
	);
}
