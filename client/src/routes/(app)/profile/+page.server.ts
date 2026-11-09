import { listMcpKeysForUser } from '$lib/server/mcp/keys';
import { getUserGroups } from '$lib/server/me';
import { getWorkSchedule } from '$lib/server/work-schedule';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const userId = locals.user!.id;
	const [schedule, mcpKeys, groups] = await Promise.all([
		getWorkSchedule(userId),
		listMcpKeysForUser(userId),
		getUserGroups(userId)
	]);

	return { user: locals.user!, schedule, mcpKeys, groups };
};
