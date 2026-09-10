import { error, json } from '@sveltejs/kit';
import { z } from 'zod';
import { taskPriorityEnum, taskStatusEnum, taskTypeEnum } from '$lib/server/db/schema';
import {
	createTask,
	getVisibleTasks,
	userCanAccessProject,
	userIsMemberOfProjectGroup
} from '$lib/server/tasks';
import type { RequestHandler } from './$types';

const createTaskSchema = z.object({
	title: z.string().min(1).max(255),
	description: z.string().optional(),
	projectId: z.string().uuid(),
	priority: z.enum(taskPriorityEnum.enumValues),
	type: z.enum(taskTypeEnum.enumValues),
	dueDate: z.string().optional(),
	ownerId: z.string().uuid().optional()
});

/**
 * GET /api/tasks — list tasks visible to the caller.
 * Every query param below is an independent, cumulative filter (AND'd together):
 *   status=in_progress&status=stand_by   (repeatable)
 *   priority=high                        (repeatable)
 *   type=mandatory                       (repeatable)
 *   projectId=<uuid>
 *   ownerId=<uuid>
 *   search=<text>                        (matches title, case-insensitive)
 *   dueAfter=YYYY-MM-DD / dueBefore=YYYY-MM-DD
 */
export const GET: RequestHandler = async ({ url, locals }) => {
	if (!locals.user) error(401, 'Não autenticado.');

	const params = url.searchParams;
	const tasks = await getVisibleTasks(locals.user.id, {
		status: params.getAll('status').filter(isEnumValue(taskStatusEnum.enumValues)),
		priority: params.getAll('priority').filter(isEnumValue(taskPriorityEnum.enumValues)),
		type: params.getAll('type').filter(isEnumValue(taskTypeEnum.enumValues)),
		projectId: params.get('projectId') ?? undefined,
		ownerId: params.get('ownerId') ?? undefined,
		search: params.get('search') ?? undefined,
		dueAfter: params.get('dueAfter') ?? undefined,
		dueBefore: params.get('dueBefore') ?? undefined
	});

	return json({ tasks });
};

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) error(401, 'Não autenticado.');

	const parsed = createTaskSchema.safeParse(await request.json());
	if (!parsed.success) {
		return json({ message: 'Dados inválidos.', issues: parsed.error.issues }, { status: 400 });
	}

	if (!(await userCanAccessProject(locals.user.id, parsed.data.projectId))) {
		return json({ message: 'Você não tem acesso a este projeto.' }, { status: 403 });
	}

	if (
		parsed.data.ownerId &&
		!(await userIsMemberOfProjectGroup(parsed.data.ownerId, parsed.data.projectId))
	) {
		return json({ message: 'O responsável não pertence ao grupo do projeto.' }, { status: 400 });
	}

	const created = await createTask({
		title: parsed.data.title,
		description: parsed.data.description || null,
		projectId: parsed.data.projectId,
		priority: parsed.data.priority,
		type: parsed.data.type,
		dueDate: parsed.data.dueDate || null,
		ownerId: parsed.data.ownerId || null,
		createdBy: locals.user.id
	});

	return json({ task: created }, { status: 201 });
};

function isEnumValue<T extends readonly string[]>(values: T) {
	return (value: string): value is T[number] => (values as readonly string[]).includes(value);
}
