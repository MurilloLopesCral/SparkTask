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
	createRecurrence,
	listRecurrencesForUser,
	materializeDueRecurrences
} from '$lib/server/recurrence';
import { userIsMemberOfProjectGroup } from '$lib/server/tasks';
import type { RequestHandler } from './$types';

const createSchema = z.object({
	projectId: z.string().uuid(),
	title: z.string().min(1).max(255),
	description: z.string().optional().nullable(),
	priority: z.enum(taskPriorityEnum.enumValues),
	type: z.enum(taskTypeEnum.enumValues),
	kind: z.enum(taskKindEnum.enumValues),
	ownerId: z.string().uuid().optional().nullable(),
	frequency: z.enum(recurrenceFrequencyEnum.enumValues),
	weekdaysOnly: z.boolean().optional(),
	weekDays: z.array(z.number().int().min(1).max(7)).optional(),
	dayOfMonth: z.number().int().min(1).max(31).optional().nullable(),
	timezone: z.string().max(64).optional(),
	startFrom: z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}$/)
		.optional()
});

export const GET: RequestHandler = async ({ url, locals }) => {
	if (!locals.user) error(401, 'Não autenticado.');

	const groupId = url.searchParams.get('groupId') ?? undefined;
	if (groupId && !z.string().uuid().safeParse(groupId).success) {
		return json({ message: 'groupId inválido.' }, { status: 400 });
	}

	const recurrences = await listRecurrencesForUser(locals.user.id, groupId);
	return json({ recurrences });
};

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) error(401, 'Não autenticado.');

	const parsed = createSchema.safeParse(await request.json());
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

	const result = await createRecurrence({
		projectId: parsed.data.projectId,
		title: parsed.data.title,
		description: parsed.data.description ?? null,
		priority: parsed.data.priority,
		type: parsed.data.type,
		kind: parsed.data.kind,
		ownerId: parsed.data.ownerId ?? null,
		createdBy: locals.user.id,
		frequency: parsed.data.frequency,
		weekdaysOnly: parsed.data.weekdaysOnly,
		weekDays: parsed.data.weekDays,
		dayOfMonth: parsed.data.dayOfMonth,
		timezone: parsed.data.timezone,
		startFrom: parsed.data.startFrom
	});

	if (!result.ok) {
		return json({ message: result.message }, { status: result.status });
	}

	await materializeDueRecurrences();

	return json({ recurrence: result.recurrence }, { status: 201 });
};
