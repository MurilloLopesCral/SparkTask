import { relations } from 'drizzle-orm';
import {
	boolean,
	date,
	integer,
	pgEnum,
	pgTable,
	primaryKey,
	text,
	timestamp,
	uuid,
	varchar
} from 'drizzle-orm/pg-core';

/**
 * Column naming: JS keys are camelCase (what better-auth's Drizzle adapter
 * matches on), DB column names are snake_case (project convention). Drizzle
 * keeps these independent, e.g. `emailVerified: boolean('email_verified')`.
 */

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const groupMemberRoleEnum = pgEnum('group_member_role', ['owner', 'moderator', 'member']);

export const taskPriorityEnum = pgEnum('task_priority', ['low', 'medium', 'high', 'critical']);

export const taskTypeEnum = pgEnum('task_type', ['mandatory', 'optional', 'desirable']);

export const taskStatusEnum = pgEnum('task_status', [
	'not_started',
	'in_progress',
	'stand_by',
	'done',
	'cancelled'
]);

// Mirrors Cloudinary's own resource_type — required to call the destroy API later.
export const fileResourceTypeEnum = pgEnum('file_resource_type', ['image', 'video', 'raw']);

// ---------------------------------------------------------------------------
// Auth (better-auth core schema — user/session/account/verification)
// https://www.better-auth.com/docs/concepts/database#core-schema
// ---------------------------------------------------------------------------

export const user = pgTable('user', {
	id: uuid('id').defaultRandom().primaryKey(),
	name: varchar('name', { length: 60 }),
	email: varchar('email', { length: 60 }).notNull().unique(),
	emailVerified: boolean('email_verified').notNull().default(false),
	image: text('image'),
	isActive: boolean('is_active').notNull().default(true),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});

export const session = pgTable('session', {
	id: uuid('id').defaultRandom().primaryKey(),
	expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
	token: text('token').notNull().unique(),
	ipAddress: text('ip_address'),
	userAgent: text('user_agent'),
	userId: uuid('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});

export const account = pgTable('account', {
	id: uuid('id').defaultRandom().primaryKey(),
	accountId: text('account_id').notNull(),
	providerId: text('provider_id').notNull(),
	// better-auth 1.7's sign-in lookup matches on this alongside providerId —
	// 'local:<providerId>' for password auth, 'local:oauth:<providerId>' for
	// OAuth. Missing this column makes every credential sign-in fail silently.
	issuer: text('issuer').notNull(),
	userId: uuid('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	accessToken: text('access_token'),
	refreshToken: text('refresh_token'),
	idToken: text('id_token'),
	accessTokenExpiresAt: timestamp('access_token_expires_at', { withTimezone: true }),
	refreshTokenExpiresAt: timestamp('refresh_token_expires_at', { withTimezone: true }),
	scope: text('scope'),
	password: text('password'),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});

export const verification = pgTable('verification', {
	id: uuid('id').defaultRandom().primaryKey(),
	identifier: text('identifier').notNull(),
	value: text('value').notNull(),
	expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
});

// ---------------------------------------------------------------------------
// Domain — groups & membership
// ---------------------------------------------------------------------------

export const group = pgTable('group', {
	id: uuid('id').defaultRandom().primaryKey(),
	name: varchar('name', { length: 255 }).notNull(),
	isActive: boolean('is_active').notNull().default(true),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});

export const invite = pgTable('invite', {
	id: uuid('id').defaultRandom().primaryKey(),
	groupId: uuid('group_id')
		.notNull()
		.references(() => group.id, { onDelete: 'cascade' }),
	email: varchar('email', { length: 60 }).notNull(),
	role: groupMemberRoleEnum('role').notNull().default('member'),
	token: text('token').notNull().unique(),
	invitedBy: uuid('invited_by')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
	acceptedAt: timestamp('accepted_at', { withTimezone: true }),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

export const groupMember = pgTable(
	'group_member',
	{
		groupId: uuid('group_id')
			.notNull()
			.references(() => group.id, { onDelete: 'cascade' }),
		memberId: uuid('member_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		role: groupMemberRoleEnum('role').notNull().default('member'),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
	},
	(t) => [primaryKey({ columns: [t.groupId, t.memberId] })]
);

// ---------------------------------------------------------------------------
// Domain — projects & tasks
// ---------------------------------------------------------------------------

export const project = pgTable('project', {
	id: uuid('id').defaultRandom().primaryKey(),
	name: varchar('name', { length: 255 }).notNull(),
	description: text('description'),
	isActive: boolean('is_active').notNull().default(true),
	groupId: uuid('group_id')
		.notNull()
		.references(() => group.id, { onDelete: 'cascade' }),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});

export const task = pgTable('task', {
	id: uuid('id').defaultRandom().primaryKey(),
	title: varchar('title', { length: 255 }).notNull(),
	description: text('description'),
	projectId: uuid('project_id')
		.notNull()
		.references(() => project.id, { onDelete: 'cascade' }),
	dueDate: date('due_date'),
	priority: taskPriorityEnum('priority').notNull(),
	type: taskTypeEnum('type').notNull(),
	status: taskStatusEnum('status').notNull().default('not_started'),
	// Assignee — nullable: a task can sit unclaimed until someone picks it up.
	ownerId: uuid('owner_id').references(() => user.id, { onDelete: 'set null' }),
	createdBy: uuid('created_by')
		.notNull()
		.references(() => user.id, { onDelete: 'restrict' }),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});

export const file = pgTable('file', {
	id: uuid('id').defaultRandom().primaryKey(),
	name: text('name').notNull(),
	size: integer('size').notNull(),
	assetUrl: text('asset_url').notNull(),
	// Cloudinary's own identifiers — needed to call the destroy API on delete.
	cloudinaryPublicId: text('cloudinary_public_id').notNull(),
	resourceType: fileResourceTypeEnum('resource_type').notNull(),
	taskId: uuid('task_id')
		.notNull()
		.references(() => task.id, { onDelete: 'cascade' }),
	uploadedBy: uuid('uploaded_by')
		.notNull()
		.references(() => user.id, { onDelete: 'restrict' }),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});

// ---------------------------------------------------------------------------
// Relations
// ---------------------------------------------------------------------------

export const userRelations = relations(user, ({ many }) => ({
	sessions: many(session),
	accounts: many(account),
	groupMemberships: many(groupMember),
	ownedTasks: many(task, { relationName: 'taskOwner' }),
	createdTasks: many(task, { relationName: 'taskCreator' }),
	uploadedFiles: many(file)
}));

export const sessionRelations = relations(session, ({ one }) => ({
	user: one(user, { fields: [session.userId], references: [user.id] })
}));

export const accountRelations = relations(account, ({ one }) => ({
	user: one(user, { fields: [account.userId], references: [user.id] })
}));

export const groupRelations = relations(group, ({ many }) => ({
	members: many(groupMember),
	projects: many(project),
	invites: many(invite)
}));

export const inviteRelations = relations(invite, ({ one }) => ({
	group: one(group, { fields: [invite.groupId], references: [group.id] }),
	invitedByUser: one(user, { fields: [invite.invitedBy], references: [user.id] })
}));

export const groupMemberRelations = relations(groupMember, ({ one }) => ({
	group: one(group, { fields: [groupMember.groupId], references: [group.id] }),
	member: one(user, { fields: [groupMember.memberId], references: [user.id] })
}));

export const projectRelations = relations(project, ({ one, many }) => ({
	group: one(group, { fields: [project.groupId], references: [group.id] }),
	tasks: many(task)
}));

export const taskRelations = relations(task, ({ one, many }) => ({
	project: one(project, { fields: [task.projectId], references: [project.id] }),
	owner: one(user, {
		fields: [task.ownerId],
		references: [user.id],
		relationName: 'taskOwner'
	}),
	creator: one(user, {
		fields: [task.createdBy],
		references: [user.id],
		relationName: 'taskCreator'
	}),
	files: many(file)
}));

export const fileRelations = relations(file, ({ one }) => ({
	task: one(task, { fields: [file.taskId], references: [task.id] }),
	uploader: one(user, { fields: [file.uploadedBy], references: [user.id] })
}));
