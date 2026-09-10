import { getAllowedExtensions, getMaxFileSizeBytes } from '$lib/server/cloudinary';
import { getVisibleGroupMembers, getVisibleProjects, getVisibleTasks } from '$lib/server/tasks';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const [tasks, projects, groupMembers] = await Promise.all([
		getVisibleTasks(locals.user!.id),
		getVisibleProjects(locals.user!.id),
		getVisibleGroupMembers(locals.user!.id)
	]);

	const fileUploadConfig = {
		allowedExtensions: getAllowedExtensions(),
		maxFileSizeBytes: getMaxFileSizeBytes()
	};

	return { tasks, projects, groupMembers, fileUploadConfig };
};
