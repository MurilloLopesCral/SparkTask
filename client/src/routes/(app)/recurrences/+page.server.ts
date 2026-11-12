import { redirect } from '@sveltejs/kit';
import { getUserGroups } from '$lib/server/me';
import { listRecurrencesForUser } from '$lib/server/recurrence';
import { getVisibleGroupMembers, getVisibleProjects } from '$lib/server/tasks';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const userId = locals.user!.id;
	const groups = await getUserGroups(userId);
	const requestedGroup = url.searchParams.get('group');
	const selectedGroup = groups.find((g) => g.id === requestedGroup) ?? groups[0] ?? null;

	// Always land with an explicit group in the URL (first membership by default).
	if (selectedGroup && requestedGroup !== selectedGroup.id) {
		const next = new URL(url);
		next.searchParams.set('group', selectedGroup.id);
		redirect(303, `${next.pathname}${next.search}`);
	}

	const [projects, groupMembers, recurrences] = await Promise.all([
		getVisibleProjects(userId),
		getVisibleGroupMembers(userId),
		listRecurrencesForUser(userId, selectedGroup?.id)
	]);

	const scopedProjects = selectedGroup
		? projects.filter((p) => p.groupId === selectedGroup.id)
		: projects;
	const scopedMembers = selectedGroup
		? groupMembers.filter((m) => m.groupId === selectedGroup.id)
		: groupMembers;
	const scopedRecurrences = selectedGroup
		? recurrences.filter((r) => r.project?.groupId === selectedGroup.id)
		: recurrences;

	return {
		groups,
		selectedGroupId: selectedGroup?.id ?? null,
		projects: scopedProjects,
		groupMembers: scopedMembers,
		recurrences: scopedRecurrences
	};
};
