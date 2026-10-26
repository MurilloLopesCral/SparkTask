import { getAllowedExtensions, getMaxFileSizeBytes } from '$lib/server/cloudinary';
import { getVisibleGroupMembers, getVisibleProjects, getVisibleTasks } from '$lib/server/tasks';
import { pauseUserIfOutsideWorkHours } from '$lib/server/work-schedule';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	// Safety net when Vercel cron is late/fails (Hobby = 1×/day).
	await pauseUserIfOutsideWorkHours(locals.user!.id);

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
