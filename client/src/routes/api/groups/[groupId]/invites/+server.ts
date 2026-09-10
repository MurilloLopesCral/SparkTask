import { error, json } from '@sveltejs/kit';
import { z } from 'zod';
import { groupMemberRoleEnum } from '$lib/server/db/schema';
import {
	createInvite,
	getGroupById,
	getGroupMembers,
	getPendingInvites,
	userIsGroupOwner
} from '$lib/server/groups';
import { sendEmail } from '$lib/server/email';
import type { RequestHandler } from './$types';

const createInviteSchema = z.object({
	email: z.email(),
	role: z.enum(groupMemberRoleEnum.enumValues)
});

export const GET: RequestHandler = async ({ params, locals }) => {
	if (!locals.user) error(401, 'Não autenticado.');
	if (!(await userIsGroupOwner(locals.user.id, params.groupId)))
		error(403, 'Apenas owners do grupo.');

	const invites = await getPendingInvites(params.groupId);
	return json({ invites });
};

export const POST: RequestHandler = async ({ params, request, locals, url }) => {
	if (!locals.user) error(401, 'Não autenticado.');
	if (!(await userIsGroupOwner(locals.user.id, params.groupId)))
		error(403, 'Apenas owners do grupo.');

	const parsed = createInviteSchema.safeParse(await request.json());
	if (!parsed.success) {
		return json({ message: 'Dados inválidos.', issues: parsed.error.issues }, { status: 400 });
	}

	const targetGroup = await getGroupById(params.groupId);
	if (!targetGroup) error(404, 'Grupo não encontrado.');

	const email = parsed.data.email.toLowerCase();

	const members = await getGroupMembers(params.groupId);
	if (members.some((m) => m.email.toLowerCase() === email)) {
		return json({ message: 'Esse e-mail já é membro do grupo.' }, { status: 409 });
	}

	const pending = await getPendingInvites(params.groupId);
	if (pending.some((i) => i.email.toLowerCase() === email && i.expiresAt.getTime() > Date.now())) {
		return json({ message: 'Já existe um convite pendente para esse e-mail.' }, { status: 409 });
	}

	const created = await createInvite({
		groupId: params.groupId,
		email,
		role: parsed.data.role,
		invitedBy: locals.user.id
	});

	const signupUrl = `${url.origin}/signup/${created.token}`;

	// The invite row is the source of truth — keep it even if the email fails
	// to send (e.g. SMTP not configured yet) so the owner can still copy and
	// share the signup link by hand instead of losing the invite entirely.
	let emailSent = true;
	try {
		await sendEmail({
			to: [created.email],
			subject: `Convite para o grupo ${targetGroup.name} — SparkTask`,
			html: `<p>Você foi convidado para o grupo <strong>${targetGroup.name}</strong> no SparkTask.</p><p>Clique para criar sua conta: <a href="${signupUrl}">${signupUrl}</a></p><p>Este convite expira em 7 dias.</p>`
		});
	} catch (err) {
		emailSent = false;
		console.error('Failed to send invite email:', err);
	}

	return json({ invite: created, signupUrl, emailSent }, { status: 201 });
};
