import { error, json } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { project } from '$lib/server/db/schema';
import { userIsGroupOwner } from '$lib/server/groups';
import { isPlexusConfigured } from '$lib/server/plexus/config';
import { syncProjectTasksToPlexus } from '$lib/server/plexus/gantt-sync';
import { parsePlexusProjectId } from '$lib/server/plexus/map';
import { userCanAccessProject } from '$lib/server/projects';
import type { RequestHandler } from './$types';

/**
 * POST /api/projects/:id/plexus-sync
 * Retroactive push of project tasks → Plexus gantt items.
 * Restricted to the group owner.
 */
export const POST: RequestHandler = async ({ params, locals }) => {
	if (!locals.user) error(401, 'Não autenticado.');
	if (!(await userCanAccessProject(locals.user.id, params.id))) {
		error(403, 'Sem acesso a este projeto.');
	}

	const [row] = await db
		.select({
			id: project.id,
			groupId: project.groupId,
			plexusProjectId: project.plexusProjectId,
			plexusTopicCode: project.plexusTopicCode
		})
		.from(project)
		.where(eq(project.id, params.id))
		.limit(1);

	if (!row) error(404, 'Projeto não encontrado.');

	if (!(await userIsGroupOwner(locals.user.id, row.groupId))) {
		return json(
			{ message: 'Somente o owner do grupo pode sincronizar tarefas com o Plexus.' },
			{ status: 403 }
		);
	}

	if (!isPlexusConfigured()) {
		return json(
			{ message: 'Plexus não configurado (PLEXUS_API_BASE_URL / PLEXUS_SERVICE_KEY).' },
			{ status: 503 }
		);
	}

	const scopeId = parsePlexusProjectId(row.plexusProjectId);
	const topicCode = row.plexusTopicCode?.trim();
	if (scopeId === null || !topicCode) {
		return json(
			{
				message:
					'Configure o ID do projeto Plexus e o topicCode da task de execução antes de sincronizar.'
			},
			{ status: 400 }
		);
	}

	const summary = await syncProjectTasksToPlexus(params.id);
	return json({ summary });
};
