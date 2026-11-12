import { error, json } from '@sveltejs/kit';
import { z } from 'zod';
import {
	recurrenceFrequencyEnum,
	taskKindEnum,
	taskPriorityEnum,
	taskTypeEnum
} from '$lib/server/db/schema';
import { userCanAccessProject } from '$lib/server/projects';
import {
	getRecurrenceById,
	materializeDueRecurrences,
	setRecurrenceEnabled,
	updateRecurrence,
	userCanAccessRecurrence
} from '$lib/server/recurrence';
import { userIsMemberOfProjectGroup } from '$lib/server/tasks';
import type { RequestHandler } from './$types';

const patchSchema = z.object({
	projectId: z.string().uuid().optional(),
	title: z.string().min(1).max(255).optional(),
	description: z.string().optional().nullable(),
	priority: z.enum(taskPriorityEnum.enumValues).optional(),
	type: z.enum(taskTypeEnum.enumValues).optional(),
	kind: z.enum(taskKindEnum.enumValues).optional(),
	ownerId: z.string().uuid().optional().nullable(),
	frequency: z.enum(recurrenceFrequencyEnum.enumValues).optional(),
	weekdaysOnly: z.boolean().optional(),
	weekDays: z.array(z.number().int().min(1).max(7)).optional(),
	dayOfMonth: z.number().int().min(1).max(31).optional().nullable(),
	timezone: z.string().max(64).optional(),
	startFrom: z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}$/)
		.optional(),
	enabled: z.boolean().optional()
});

export const PATCH: RequestHandler = async ({ params, request, locals }) => {
	if (!locals.user) error(401, 'Não autenticado.');

	if (!(await userCanAccessRecurrence(locals.user.id, params.id))) {
		return json({ message: 'Recorrência não encontrada ou sem acesso.' }, { status: 404 });
	}

	const parsed = patchSchema.safeParse(await request.json());
	if (!parsed.success) {
		return json({ message: 'Dados inválidos.', issues: parsed.error.issues }, { status: 400 });
	}

	if (
		parsed.data.projectId &&
		!(await userCanAccessProject(locals.user.id, parsed.data.projectId))
	) {
		return json({ message: 'Você não tem acesso a este projeto.' }, { status: 403 });
	}

	const current = await getRecurrenceById(params.id);
	if (!current) {
		return json({ message: 'Recorrência não encontrada ou sem acesso.' }, { status: 404 });
	}

	const projectIdForOwner = parsed.data.projectId ?? current.projectId;
	if (parsed.data.ownerId) {
		if (!(await userIsMemberOfProjectGroup(parsed.data.ownerId, projectIdForOwner))) {
			return json({ message: 'O responsável não pertence ao grupo do projeto.' }, { status: 400 });
		}
	}

	// Toggle-only shortcut keeps payloads tiny from the UI pause button.
	if (parsed.data.enabled !== undefined && Object.keys(parsed.data).length === 1) {
		const result = await setRecurrenceEnabled(params.id, parsed.data.enabled);
		if (!result.ok) {
			return json({ message: result.message }, { status: result.status });
		}
		if (parsed.data.enabled) await materializeDueRecurrences();
		return json({ recurrence: result.recurrence });
	}

	const result = await updateRecurrence(params.id, parsed.data);
	if (!result.ok) {
		return json({ message: result.message }, { status: result.status });
	}

	await materializeDueRecurrences();

	return json({ recurrence: result.recurrence });
};
