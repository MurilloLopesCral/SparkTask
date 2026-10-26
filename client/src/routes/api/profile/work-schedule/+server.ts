import { error, json } from '@sveltejs/kit';
import { z } from 'zod';
import {
	getWorkSchedule,
	normalizeWorkDays,
	upsertWorkSchedule
} from '$lib/server/work-schedule';
import { isValidTimeHHmm, WORK_SCHEDULE_TIMEZONE } from '$lib/users/work-schedule';
import type { RequestHandler } from './$types';

const patchSchema = z.object({
	enabled: z.boolean(),
	timezone: z.string().min(1).max(64).optional(),
	workDays: z.array(z.number().int().min(1).max(7)).min(0).max(7),
	startTime: z.string(),
	endTime: z.string()
});

/** GET /api/profile/work-schedule */
export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) error(401, 'Não autenticado.');
	const schedule = await getWorkSchedule(locals.user.id);
	return json({ schedule });
};

/** PATCH /api/profile/work-schedule */
export const PATCH: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) error(401, 'Não autenticado.');

	const parsed = patchSchema.safeParse(await request.json());
	if (!parsed.success) {
		return json({ message: 'Dados inválidos.', issues: parsed.error.issues }, { status: 400 });
	}

	const { enabled, workDays, startTime, endTime } = parsed.data;
	const timezone = parsed.data.timezone?.trim() || WORK_SCHEDULE_TIMEZONE;

	if (!isValidTimeHHmm(startTime) || !isValidTimeHHmm(endTime)) {
		return json({ message: 'Horários inválidos. Use o formato HH:mm.' }, { status: 400 });
	}
	if (endTime <= startTime) {
		return json(
			{ message: 'O horário final precisa ser depois do horário inicial.' },
			{ status: 400 }
		);
	}

	const schedule = await upsertWorkSchedule(locals.user.id, {
		enabled,
		timezone,
		workDays: normalizeWorkDays(workDays),
		startTime,
		endTime
	});

	return json({ schedule });
};
