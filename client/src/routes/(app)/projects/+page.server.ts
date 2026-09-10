import { getUserGroups } from '$lib/server/me';
import { getVisibleProjects } from '$lib/server/projects';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const [projects, groups] = await Promise.all([
		getVisibleProjects(locals.user!.id),
		getUserGroups(locals.user!.id)
	]);

	return { projects, groups };
};
