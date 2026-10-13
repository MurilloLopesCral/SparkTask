import { error, json } from '@sveltejs/kit';
import { z } from 'zod';
import { taskPriorityEnum, taskStatusEnum, taskTypeEnum } from '$lib/server/db/schema';
import {
	deleteTaskById,
	getTaskProjectAndOwner,
	updateTaskFields,
	userCanAccessProject,
	userCanAccessTask,
	userIsMemberOfProjectGroup
} from '$lib/server/tasks';
import type { RequestHandler } from './$types';

const patchTaskSchema = z
	.object({
		title: z.string().min(1).max(255),
		description: z.string().nullable(),
		status: z.enum(taskStatusEnum.enumValues),
		priority: z.enum(taskPriorityEnum.enumValues),
		type: z.enum(taskTypeEnum.enumValues),
		dueDate: z.string().nullable(),
		ownerId: z.string().uuid().nullable(),
		projectId: z.string().uuid()
	})
	.partial();

/** PATCH /api/tasks/:id — partial update, single endpoint for every editable field. */
export const PATCH: RequestHandler = async ({ params, request, locals }) => {
	if (!locals.user) error(401, 'Não autenticado.');
	if (!(await userCanAccessTask(locals.user.id, params.id)))
		error(403, 'Sem acesso a esta tarefa.');

	const parsed = patchTaskSchema.safeParse(await request.json());
	if (!parsed.success) {
		return json({ message: 'Dados inválidos.', issues: parsed.error.issues }, { status: 400 });
	}
	if (Object.keys(parsed.data).length === 0) {
		return json({ message: 'Nada para atualizar.' }, { status: 400 });
	}

	const current = await getTaskProjectAndOwner(params.id);
	if (!current) error(404, 'Tarefa não encontrada.');

	const fields = { ...parsed.data };

	if (fields.projectId && !(await userCanAccessProject(locals.user.id, fields.projectId))) {
		return json({ message: 'Você não tem acesso a este projeto.' }, { status: 403 });
	}

	const targetProjectId = fields.projectId ?? current.projectId;
	const targetOwnerId = fields.ownerId !== undefined ? fields.ownerId : current.ownerId;

	if (targetOwnerId) {
		const ownerOk = await userIsMemberOfProjectGroup(targetOwnerId, targetProjectId);
		if (!ownerOk) {
			if (fields.ownerId !== undefined) {
				return json(
					{ message: 'O responsável não pertence ao grupo do projeto.' },
					{ status: 400 }
				);
			}
			// Project moved; drop an owner that no longer belongs to the new group.
			fields.ownerId = null;
		}
	}

	await updateTaskFields(params.id, fields);
	return json({ success: true });
};

export const DELETE: RequestHandler = async ({ params, locals }) => {
	if (!locals.user) error(401, 'Não autenticado.');
	if (!(await userCanAccessTask(locals.user.id, params.id)))
		error(403, 'Sem acesso a esta tarefa.');

	await deleteTaskById(params.id);
	return json({ success: true });
};
