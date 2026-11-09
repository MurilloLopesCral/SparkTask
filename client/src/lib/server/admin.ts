import { and, desc, eq, isNull, sql } from 'drizzle-orm';
import { db } from './db';
import { group, groupMember, invite, user } from './db/schema';
import { createInvite } from './groups';
import { sendEmail } from './email';

export async function userIsSystemAdmin(userId: string) {
	const row = await db.query.user.findFirst({
		where: eq(user.id, userId),
		columns: { isSystemAdmin: true }
	});
	return row?.isSystemAdmin === true;
}

export async function listAllGroups() {
	const groups = await db.query.group.findMany({
		orderBy: [desc(group.createdAt)],
		with: {
			members: {
				with: {
					member: {
						columns: { id: true, name: true, email: true, image: true }
					}
				}
			},
			invites: {
				where: and(eq(invite.role, 'owner'), isNull(invite.acceptedAt)),
				columns: {
					id: true,
					email: true,
					token: true,
					expiresAt: true,
					createdAt: true
				}
			}
		}
	});

	return groups.map((g) => ({
		id: g.id,
		name: g.name,
		isActive: g.isActive,
		createdAt: g.createdAt,
		owners: g.members
			.filter((m) => m.role === 'owner')
			.map((m) => ({
				id: m.member.id,
				name: m.member.name,
				email: m.member.email,
				image: m.member.image
			})),
		pendingOwnerInvites: g.invites.map((i) => ({
			id: i.id,
			email: i.email,
			token: i.token,
			expiresAt: i.expiresAt,
			createdAt: i.createdAt
		}))
	}));
}

export async function findUserByEmail(email: string) {
	const normalized = email.trim().toLowerCase();
	return db.query.user.findFirst({
		where: sql`lower(${user.email}) = ${normalized}`,
		columns: { id: true, name: true, email: true, isActive: true }
	});
}

export async function createGroupWithOwner(input: {
	name: string;
	ownerUserId: string;
}) {
	const owner = await db.query.user.findFirst({
		where: eq(user.id, input.ownerUserId),
		columns: { id: true, isActive: true, email: true, name: true }
	});
	if (!owner) {
		return { ok: false as const, message: 'Usuário owner não encontrado.', status: 404 };
	}
	if (!owner.isActive) {
		return { ok: false as const, message: 'O usuário owner está inativo.', status: 400 };
	}

	const name = input.name.trim();
	if (!name) {
		return { ok: false as const, message: 'Nome do grupo é obrigatório.', status: 400 };
	}

	const created = await db.transaction(async (tx) => {
		const [createdGroup] = await tx
			.insert(group)
			.values({ name })
			.returning({
				id: group.id,
				name: group.name,
				isActive: group.isActive,
				createdAt: group.createdAt
			});

		await tx.insert(groupMember).values({
			groupId: createdGroup.id,
			memberId: owner.id,
			role: 'owner'
		});

		return createdGroup;
	});

	return {
		ok: true as const,
		mode: 'existing' as const,
		group: created,
		owner: { id: owner.id, name: owner.name, email: owner.email }
	};
}

/**
 * Creates a group and invites a new owner by email (no account yet).
 * On signup via the invite token, they become owner of the group.
 */
export async function createGroupAndInviteOwner(input: {
	name: string;
	ownerEmail: string;
	invitedByUserId: string;
	origin: string;
}) {
	const name = input.name.trim();
	if (!name) {
		return { ok: false as const, message: 'Nome do grupo é obrigatório.', status: 400 };
	}

	const email = input.ownerEmail.trim().toLowerCase();
	const existing = await findUserByEmail(email);
	if (existing) {
		return {
			ok: false as const,
			message: 'Já existe conta com este e-mail. Use a opção “Usuário existente”.',
			status: 409
		};
	}

	const createdGroup = await db.transaction(async (tx) => {
		const [row] = await tx
			.insert(group)
			.values({ name })
			.returning({
				id: group.id,
				name: group.name,
				isActive: group.isActive,
				createdAt: group.createdAt
			});
		return row;
	});

	const createdInvite = await createInvite({
		groupId: createdGroup.id,
		email,
		role: 'owner',
		invitedBy: input.invitedByUserId
	});

	const signupUrl = `${input.origin}/signup/${createdInvite.token}`;

	let emailSent = true;
	try {
		await sendEmail({
			to: [email],
			subject: `Você foi convidado como owner do grupo ${createdGroup.name} — SparkTask`,
			html: `<p>Você foi convidado para ser <strong>owner</strong> do grupo <strong>${createdGroup.name}</strong> no SparkTask.</p><p>Crie sua conta para começar: <a href="${signupUrl}">${signupUrl}</a></p><p>Este convite expira em 7 dias.</p>`
		});
	} catch (err) {
		emailSent = false;
		console.error('Failed to send owner invite email:', err);
	}

	return {
		ok: true as const,
		mode: 'invite' as const,
		group: createdGroup,
		invite: {
			id: createdInvite.id,
			email: createdInvite.email,
			expiresAt: createdInvite.expiresAt
		},
		signupUrl,
		emailSent
	};
}

export async function setGroupActive(groupId: string, isActive: boolean) {
	const [updated] = await db
		.update(group)
		.set({ isActive, updatedAt: new Date() })
		.where(eq(group.id, groupId))
		.returning({
			id: group.id,
			name: group.name,
			isActive: group.isActive
		});

	if (!updated) {
		return { ok: false as const, message: 'Grupo não encontrado.', status: 404 };
	}
	return { ok: true as const, group: updated };
}

/** Lists active users for the owner picker (sys admin create-group form). */
export async function listUsersForOwnerPicker() {
	return db.query.user.findMany({
		where: and(eq(user.isActive, true)),
		columns: { id: true, name: true, email: true },
		orderBy: [desc(user.createdAt)],
		limit: 200
	});
}
