import { getWorkSchedule } from '$lib/server/work-schedule';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const schedule = await getWorkSchedule(locals.user!.id);
	return { user: locals.user!, schedule };
};
