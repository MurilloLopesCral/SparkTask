import { and, eq, inArray } from 'drizzle-orm';
import { db } from './db';
import { groupMember, project } from './db/schema';

export async function getVisibleProjects(userId: string) {
	const memberships = await db
		.select({ groupId: groupMember.groupId })
		.from(groupMember)
		.where(eq(groupMember.memberId, userId));

	const groupIds = memberships.map((m) => m.groupId);
	if (groupIds.length === 0) return [];

	return db.query.project.findMany({
		where: inArray(project.groupId, groupIds),
		with: { group: true },
		orderBy: (p, { desc }) => [desc(p.createdAt)]
	});
}

export type VisibleProject = Awaited<ReturnType<typeof getVisibleProjects>>[number];

/** Guards project creation — the caller must belong to the target group. */
export async function userCanAccessGroup(userId: string, groupId: string) {
	const rows = await db
		.select({ groupId: groupMember.groupId })
		.from(groupMember)
		.where(and(eq(groupMember.groupId, groupId), eq(groupMember.memberId, userId)))
		.limit(1);

	return rows.length > 0;
}

/** Guards project edit/delete — the caller must belong to the project's own group. */
export async function userCanAccessProject(userId: string, projectId: string) {
	const rows = await db
		.select({ projectId: project.id })
		.from(project)
		.innerJoin(
			groupMember,
			and(eq(groupMember.groupId, project.groupId), eq(groupMember.memberId, userId))
		)
		.where(eq(project.id, projectId))
		.limit(1);

	return rows.length > 0;
}

export interface CreateProjectInput {
	name: string;
	description: string | null;
	groupId: string;
}

export async function createProject(input: CreateProjectInput) {
	const [created] = await db.insert(project).values(input).returning();
	return created;
}

export interface ProjectUpdateFields {
	name?: string;
	description?: string | null;
}

export async function updateProjectFields(projectId: string, fields: ProjectUpdateFields) {
	await db
		.update(project)
		.set({ ...fields, updatedAt: new Date() })
		.where(eq(project.id, projectId));
}

export async function deleteProjectById(projectId: string) {
	await db.delete(project).where(eq(project.id, projectId));
}
