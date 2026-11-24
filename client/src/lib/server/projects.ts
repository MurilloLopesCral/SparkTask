import { and, asc, eq, inArray, sql } from 'drizzle-orm';
import { db } from './db';
import { groupMember, project, projectVersion } from './db/schema';

export async function getVisibleProjects(userId: string) {
	const memberships = await db
		.select({ groupId: groupMember.groupId })
		.from(groupMember)
		.where(eq(groupMember.memberId, userId));

	const groupIds = memberships.map((m) => m.groupId);
	if (groupIds.length === 0) return [];

	return db.query.project.findMany({
		where: inArray(project.groupId, groupIds),
		with: {
			group: true,
			versions: { orderBy: (v, { asc: a }) => [a(v.sortOrder)] }
		},
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

export type ProjectPlexusFields = {
	plexusProjectId?: string | null;
	plexusTopicCode?: string | null;
};

export type VersionPhaseFields = {
	implementationStart?: string | null;
	implementationEnd?: string | null;
	assistedOpsStart?: string | null;
	assistedOpsEnd?: string | null;
	performanceStart?: string | null;
	performanceEnd?: string | null;
};

export interface CreateProjectInput extends ProjectPlexusFields, VersionPhaseFields {
	name: string;
	description: string | null;
	groupId: string;
}

export async function createProject(input: CreateProjectInput) {
	const {
		implementationStart,
		implementationEnd,
		assistedOpsStart,
		assistedOpsEnd,
		performanceStart,
		performanceEnd,
		...projectFields
	} = input;

	const [created] = await db.insert(project).values(projectFields).returning();

	await db.insert(projectVersion).values({
		projectId: created.id,
		label: 'V1',
		sortOrder: 1,
		plexusSyncEnabled: true,
		implementationStart,
		implementationEnd,
		assistedOpsStart,
		assistedOpsEnd,
		performanceStart,
		performanceEnd
	});

	return created;
}

export interface ProjectUpdateFields extends ProjectPlexusFields {
	name?: string;
	description?: string | null;
	image?: string | null;
}

export async function updateProjectFields(projectId: string, fields: ProjectUpdateFields) {
	await db
		.update(project)
		.set({ ...fields, updatedAt: new Date() })
		.where(eq(project.id, projectId));
}

export async function setProjectImage(projectId: string, image: string | null) {
	await updateProjectFields(projectId, { image });
}

export async function deleteProjectById(projectId: string) {
	await db.delete(project).where(eq(project.id, projectId));
}

export async function getProjectVersions(projectId: string) {
	return db.query.projectVersion.findMany({
		where: eq(projectVersion.projectId, projectId),
		orderBy: [asc(projectVersion.sortOrder)]
	});
}

/** Default version for a project (lowest sortOrder) — used by recurrence/MCP. */
export async function getDefaultProjectVersionId(projectId: string) {
	const [row] = await db
		.select({ id: projectVersion.id })
		.from(projectVersion)
		.where(eq(projectVersion.projectId, projectId))
		.orderBy(asc(projectVersion.sortOrder))
		.limit(1);
	return row?.id ?? null;
}

export async function versionBelongsToProject(versionId: string, projectId: string) {
	const [row] = await db
		.select({ id: projectVersion.id })
		.from(projectVersion)
		.where(and(eq(projectVersion.id, versionId), eq(projectVersion.projectId, projectId)))
		.limit(1);
	return Boolean(row);
}

export interface CreateVersionInput extends VersionPhaseFields {
	projectId: string;
	plexusSyncEnabled?: boolean;
}

/** Next label = V{maxSort+1}. */
export async function createProjectVersion(input: CreateVersionInput) {
	const [agg] = await db
		.select({ maxOrder: sql<number>`coalesce(max(${projectVersion.sortOrder}), 0)` })
		.from(projectVersion)
		.where(eq(projectVersion.projectId, input.projectId));

	const next = Number(agg?.maxOrder ?? 0) + 1;
	const [created] = await db
		.insert(projectVersion)
		.values({
			projectId: input.projectId,
			label: `V${next}`,
			sortOrder: next,
			plexusSyncEnabled: input.plexusSyncEnabled ?? true,
			implementationStart: input.implementationStart,
			implementationEnd: input.implementationEnd,
			assistedOpsStart: input.assistedOpsStart,
			assistedOpsEnd: input.assistedOpsEnd,
			performanceStart: input.performanceStart,
			performanceEnd: input.performanceEnd
		})
		.returning();
	return created;
}

export interface VersionUpdateFields extends VersionPhaseFields {
	plexusSyncEnabled?: boolean;
	label?: string;
	description?: string | null;
}

export async function updateProjectVersion(versionId: string, fields: VersionUpdateFields) {
	await db
		.update(projectVersion)
		.set({ ...fields, updatedAt: new Date() })
		.where(eq(projectVersion.id, versionId));
}

export async function getProjectsForGroup(userId: string, groupId: string) {
	if (!(await userCanAccessGroup(userId, groupId))) return null;

	return db.query.project.findMany({
		where: and(eq(project.groupId, groupId), eq(project.isActive, true)),
		orderBy: (p, { asc: a }) => [a(p.name)],
		columns: {
			id: true,
			name: true,
			groupId: true,
			plexusProjectId: true,
			plexusTopicCode: true
		},
		with: {
			versions: { orderBy: (v, { asc: a }) => [a(v.sortOrder)] }
		}
	});
}

/** One Gantt row per version — calendar feed. */
export async function getRoadmapProjects(userId: string) {
	const memberships = await db
		.select({ groupId: groupMember.groupId })
		.from(groupMember)
		.where(eq(groupMember.memberId, userId));

	const groupIds = memberships.map((m) => m.groupId);
	if (groupIds.length === 0) return [];

	const projects = await db.query.project.findMany({
		where: and(inArray(project.groupId, groupIds), eq(project.isActive, true)),
		orderBy: (p, { asc: a }) => [a(p.name)],
		columns: {
			id: true,
			name: true,
			groupId: true,
			plexusProjectId: true
		},
		with: {
			versions: { orderBy: (v, { asc: a }) => [a(v.sortOrder)] }
		}
	});

	return projects.flatMap((p) =>
		p.versions.map((v) => ({
			id: v.id,
			projectId: p.id,
			name: `${p.name} · ${v.label}`,
			groupId: p.groupId,
			plexusProjectId: p.plexusProjectId,
			implementationStart: v.implementationStart,
			implementationEnd: v.implementationEnd,
			assistedOpsStart: v.assistedOpsStart,
			assistedOpsEnd: v.assistedOpsEnd,
			performanceStart: v.performanceStart,
			performanceEnd: v.performanceEnd
		}))
	);
}
