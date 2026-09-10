import { and, desc, eq, gte, ilike, inArray, lte, type SQL } from 'drizzle-orm';
import { db } from './db';
import {
	groupMember,
	project,
	task,
	user,
	type taskPriorityEnum,
	type taskStatusEnum,
	type taskTypeEnum
} from './db/schema';

export interface TaskFilters {
	status?: (typeof taskStatusEnum.enumValues)[number][];
	priority?: (typeof taskPriorityEnum.enumValues)[number][];
	type?: (typeof taskTypeEnum.enumValues)[number][];
	projectId?: string;
	ownerId?: string;
	search?: string;
	dueBefore?: string;
	dueAfter?: string;
}

async function getVisibleGroupIds(userId: string) {
	const memberships = await db
		.select({ groupId: groupMember.groupId })
		.from(groupMember)
		.where(eq(groupMember.memberId, userId));

	return memberships.map((m) => m.groupId);
}

async function getVisibleProjectIds(userId: string) {
	const groupIds = await getVisibleGroupIds(userId);
	if (groupIds.length === 0) return [];

	const projects = await db
		.select({ id: project.id })
		.from(project)
		.where(inArray(project.groupId, groupIds));
	return projects.map((p) => p.id);
}

/** Every filter provided is combined with AND — callers stack as many as they need. */
export async function getVisibleTasks(userId: string, filters: TaskFilters = {}) {
	const projectIds = await getVisibleProjectIds(userId);
	if (projectIds.length === 0) return [];

	const conditions: SQL[] = [inArray(task.projectId, projectIds)];

	if (filters.projectId) conditions.push(eq(task.projectId, filters.projectId));
	if (filters.ownerId) conditions.push(eq(task.ownerId, filters.ownerId));
	if (filters.status?.length) conditions.push(inArray(task.status, filters.status));
	if (filters.priority?.length) conditions.push(inArray(task.priority, filters.priority));
	if (filters.type?.length) conditions.push(inArray(task.type, filters.type));
	if (filters.search) conditions.push(ilike(task.title, `%${filters.search}%`));
	if (filters.dueAfter) conditions.push(gte(task.dueDate, filters.dueAfter));
	if (filters.dueBefore) conditions.push(lte(task.dueDate, filters.dueBefore));

	return db.query.task.findMany({
		where: and(...conditions),
		orderBy: [desc(task.createdAt)],
		with: {
			project: true,
			owner: true,
			creator: true,
			files: { with: { uploader: true }, orderBy: (file, { desc }) => [desc(file.createdAt)] }
		}
	});
}

export type VisibleTask = Awaited<ReturnType<typeof getVisibleTasks>>[number];

export async function getVisibleProjects(userId: string) {
	const projectIds = await getVisibleProjectIds(userId);
	if (projectIds.length === 0) return [];

	return db.query.project.findMany({
		where: inArray(project.id, projectIds),
		columns: { id: true, name: true, groupId: true }
	});
}

/** Members of every group the caller belongs to — used to populate "responsável" pickers. */
export async function getVisibleGroupMembers(userId: string) {
	const groupIds = await getVisibleGroupIds(userId);
	if (groupIds.length === 0) return [];

	return db
		.select({
			groupId: groupMember.groupId,
			id: user.id,
			name: user.name,
			email: user.email
		})
		.from(groupMember)
		.innerJoin(user, eq(user.id, groupMember.memberId))
		.where(inArray(groupMember.groupId, groupIds));
}

/** Guards the "responsável" pick — the chosen owner must belong to the project's group. */
export async function userIsMemberOfProjectGroup(userId: string, projectId: string) {
	const rows = await db
		.select({ groupId: groupMember.groupId })
		.from(project)
		.innerJoin(
			groupMember,
			and(eq(groupMember.groupId, project.groupId), eq(groupMember.memberId, userId))
		)
		.where(eq(project.id, projectId))
		.limit(1);

	return rows.length > 0;
}

/** Guards task mutations — a task is only reachable if the caller belongs to its project's group. */
export async function userCanAccessTask(userId: string, taskId: string) {
	const rows = await db
		.select({ taskId: task.id })
		.from(task)
		.innerJoin(project, eq(project.id, task.projectId))
		.innerJoin(
			groupMember,
			and(eq(groupMember.groupId, project.groupId), eq(groupMember.memberId, userId))
		)
		.where(eq(task.id, taskId))
		.limit(1);

	return rows.length > 0;
}

export async function getTaskProjectId(taskId: string) {
	const [row] = await db
		.select({ projectId: task.projectId })
		.from(task)
		.where(eq(task.id, taskId))
		.limit(1);

	return row?.projectId;
}

/** Guards task creation — the target project must belong to one of the caller's groups. */
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

export interface CreateTaskInput {
	title: string;
	description: string | null;
	projectId: string;
	priority: (typeof taskPriorityEnum.enumValues)[number];
	type: (typeof taskTypeEnum.enumValues)[number];
	dueDate: string | null;
	ownerId: string | null;
	createdBy: string;
}

export async function createTask(input: CreateTaskInput) {
	const [created] = await db.insert(task).values(input).returning();
	return created;
}

export interface TaskUpdateFields {
	title?: string;
	description?: string | null;
	status?: (typeof taskStatusEnum.enumValues)[number];
	priority?: (typeof taskPriorityEnum.enumValues)[number];
	type?: (typeof taskTypeEnum.enumValues)[number];
	dueDate?: string | null;
	ownerId?: string | null;
}

export async function updateTaskFields(taskId: string, fields: TaskUpdateFields) {
	await db
		.update(task)
		.set({ ...fields, updatedAt: new Date() })
		.where(eq(task.id, taskId));
}

export async function deleteTaskById(taskId: string) {
	await db.delete(task).where(eq(task.id, taskId));
}
