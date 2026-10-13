import { getHomeDashboard } from '$lib/server/dashboard';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent }) => {
	const { user } = await parent();
	const dashboard = await getHomeDashboard(user.id);
	return { dashboard };
};
