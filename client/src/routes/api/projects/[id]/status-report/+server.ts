import { error, json } from '@sveltejs/kit';
import { z } from 'zod';
import { taskKindEnum, taskStatusEnum } from '$lib/server/db/schema';
import {
	buildProjectStatusReport,
	listProjectTasksForReport
} from '$lib/server/status-report';
import type { RequestHandler } from './$types';

const querySchema = z.object({
	createdAfter: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
	createdBefore: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
	status: z.array(z.enum(taskStatusEnum.enumValues)).optional(),
	kind: z.array(z.enum(taskKindEnum.enumValues)).optional(),
	taskIds: z.array(z.string().uuid()).optional(),
	periodLabel: z.string().max(120).optional()
});

/** GET /api/projects/:id/status-report — filtered report payload for PDF export. */
export const GET: RequestHandler = async ({ params, url, locals }) => {
	if (!locals.user) error(401, 'Não autenticado.');

	const listOnly = url.searchParams.get('list') === '1';
	if (listOnly) {
		const tasks = await listProjectTasksForReport(locals.user.id, params.id);
		if (!tasks) error(403, 'Sem acesso a este projeto.');
		return json({ tasks });
	}

	const parsed = querySchema.safeParse({
		createdAfter: url.searchParams.get('createdAfter') ?? undefined,
		createdBefore: url.searchParams.get('createdBefore') ?? undefined,
		status: url.searchParams.getAll('status').filter(Boolean),
		kind: url.searchParams.getAll('kind').filter(Boolean),
		taskIds: url.searchParams.getAll('taskId').filter(Boolean),
		periodLabel: url.searchParams.get('periodLabel') ?? undefined
	});

	if (!parsed.success) {
		return json({ message: 'Filtros inválidos.', issues: parsed.error.issues }, { status: 400 });
	}

	const { createdAfter, createdBefore, status, kind, taskIds, periodLabel } = parsed.data;

	if (createdAfter && createdBefore && createdAfter > createdBefore) {
		return json({ message: 'A data inicial não pode ser depois da final.' }, { status: 400 });
	}

	const result = await buildProjectStatusReport(
		locals.user.id,
		{
			projectId: params.id,
			createdAfter,
			createdBefore,
			status: status?.length ? status : undefined,
			kind: kind?.length ? kind : undefined,
			taskIds: taskIds?.length ? taskIds : undefined
		},
		periodLabel?.trim() || 'Projeto completo'
	);

	if (!result.ok) {
		return json({ message: result.message }, { status: result.status });
	}

	return json({ report: result.report });
};
