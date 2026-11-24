import { getCalendarEvents } from '$lib/server/calendar';
import { getUserGroups } from '$lib/server/me';
import { getRoadmapProjects } from '$lib/server/projects';
import { materializeDueRecurrences } from '$lib/server/recurrence';
import { getVisibleGroupMembers, getVisibleProjects } from '$lib/server/tasks';
import { rangeForView, toYmd } from '$lib/calendar/dates';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const userId = locals.user!.id;

	// Safety net when Vercel cron is late/fails (Hobby = 1×/day).
	await materializeDueRecurrences();

	const groups = await getUserGroups(userId);
	const requestedGroup = url.searchParams.get('group');
	const selectedGroup = groups.find((g) => g.id === requestedGroup) ?? groups[0] ?? null;

	const tabParam = url.searchParams.get('tab');
	const tab = tabParam === 'projects' ? ('projects' as const) : ('tasks' as const);

	const viewParam = url.searchParams.get('view');
	const view =
		viewParam === 'week' || viewParam === 'list' || viewParam === 'month' ? viewParam : 'month';

	const anchorParam = url.searchParams.get('date');
	const anchor =
		anchorParam && /^\d{4}-\d{2}-\d{2}$/.test(anchorParam)
			? new Date(
					Number(anchorParam.slice(0, 4)),
					Number(anchorParam.slice(5, 7)) - 1,
					Number(anchorParam.slice(8, 10))
				)
			: new Date();

	const scope = url.searchParams.get('scope') === 'mine' ? 'mine' : 'group';
	// Legacy `mine=1` still maps to personal scope.
	const mineOnly = scope === 'mine' || url.searchParams.get('mine') === '1';
	const requestedProject = url.searchParams.get('project') ?? undefined;

	const { from, to } = rangeForView(view, anchor);

	const [projects, roadmapProjects, groupMembers] = await Promise.all([
		getVisibleProjects(userId),
		getRoadmapProjects(userId),
		getVisibleGroupMembers(userId)
	]);

	const scopedProjects = selectedGroup
		? projects.filter((p) => p.groupId === selectedGroup.id)
		: projects;
	const scopedRoadmap = selectedGroup
		? roadmapProjects.filter((p) => p.groupId === selectedGroup.id)
		: roadmapProjects;
	const selectedProjectId =
		requestedProject &&
		(scopedProjects.some((p) => p.id === requestedProject) ||
			scopedRoadmap.some((p) => p.projectId === requestedProject))
			? requestedProject
			: undefined;

	const calendarResult =
		selectedGroup && tab === 'tasks'
			? await getCalendarEvents(userId, {
					groupId: selectedGroup.id,
					from,
					to,
					userId: mineOnly ? userId : undefined,
					projectId: selectedProjectId
				})
			: { ok: true as const, events: [] };

	const events = calendarResult.ok ? calendarResult.events : [];
	const scopedMembers = selectedGroup
		? groupMembers.filter((m) => m.groupId === selectedGroup.id)
		: groupMembers;

	return {
		groups,
		selectedGroupId: selectedGroup?.id ?? null,
		selectedProjectId: selectedProjectId ?? null,
		tab,
		view,
		anchorDate: toYmd(anchor),
		scope: mineOnly ? ('mine' as const) : ('group' as const),
		from,
		to,
		events,
		projects: scopedProjects,
		roadmapProjects: scopedRoadmap,
		groupMembers: scopedMembers,
		currentUserId: userId
	};
};
