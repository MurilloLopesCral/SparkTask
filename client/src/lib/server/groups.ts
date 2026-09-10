import { randomBytes } from 'node:crypto';
import { and, eq, isNull } from 'drizzle-orm';
import { db } from './db';
import { group, groupMember, invite, type groupMemberRoleEnum } from './db/schema';

const INVITE_TTL_DAYS = 7;

export async function getOwnedGroups(userId: string) {
	const memberships = await db.query.groupMember.findMany({
		where: and(eq(groupMember.memberId, userId), eq(groupMember.role, 'owner')),
		with: { group: true }
	});

	return memberships.map((m) => m.group);
}

export async function userIsGroupOwner(userId: string, groupId: string) {
	const row = await db.query.groupMember.findFirst({
		where: and(
			eq(groupMember.groupId, groupId),
			eq(groupMember.memberId, userId),
			eq(groupMember.role, 'owner')
		)
	});

	return row !== undefined;
}

export async function getGroupMembers(groupId: string) {
	const rows = await db.query.groupMember.findMany({
		where: eq(groupMember.groupId, groupId),
		with: { member: true },
		orderBy: (gm, { asc }) => [asc(gm.createdAt)]
	});

	return rows.map((r) => ({
		id: r.member.id,
		name: r.member.name,
		email: r.member.email,
		image: r.member.image,
		role: r.role,
		joinedAt: r.createdAt
	}));
}

export async function getPendingInvites(groupId: string) {
	return db.query.invite.findMany({
		where: and(eq(invite.groupId, groupId), isNull(invite.acceptedAt)),
		orderBy: (i, { desc }) => [desc(i.createdAt)]
	});
}

export interface CreateInviteInput {
	groupId: string;
	email: string;
	role: (typeof groupMemberRoleEnum.enumValues)[number];
	invitedBy: string;
}

export async function createInvite(input: CreateInviteInput) {
	const token = randomBytes(32).toString('base64url');
	const expiresAt = new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000);

	const [created] = await db
		.insert(invite)
		.values({ ...input, token, expiresAt })
		.returning();

	return created;
}

/** Guards revoking an invite — the caller must own the group it belongs to. */
export async function userCanManageInvite(userId: string, inviteId: string) {
	const row = await db
		.select({ groupId: invite.groupId })
		.from(invite)
		.innerJoin(
			groupMember,
			and(
				eq(groupMember.groupId, invite.groupId),
				eq(groupMember.memberId, userId),
				eq(groupMember.role, 'owner')
			)
		)
		.where(eq(invite.id, inviteId))
		.limit(1);

	return row.length > 0;
}

export async function revokeInvite(inviteId: string) {
	await db.delete(invite).where(eq(invite.id, inviteId));
}

export async function getGroupById(groupId: string) {
	return db.query.group.findFirst({ where: eq(group.id, groupId) });
}

export async function countGroupOwners(groupId: string) {
	const rows = await db
		.select({ memberId: groupMember.memberId })
		.from(groupMember)
		.where(and(eq(groupMember.groupId, groupId), eq(groupMember.role, 'owner')));

	return rows.length;
}

export async function getGroupMemberRole(groupId: string, memberId: string) {
	const row = await db.query.groupMember.findFirst({
		where: and(eq(groupMember.groupId, groupId), eq(groupMember.memberId, memberId))
	});

	return row?.role ?? null;
}

/** Removes a member from the group — does not touch their user account. */
export async function removeMember(groupId: string, memberId: string) {
	await db
		.delete(groupMember)
		.where(and(eq(groupMember.groupId, groupId), eq(groupMember.memberId, memberId)));
}
