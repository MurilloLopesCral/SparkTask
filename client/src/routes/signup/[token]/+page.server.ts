import { error, redirect } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { eq } from 'drizzle-orm';
import { APIError } from 'better-auth';
import { auth } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { groupMember, invite } from '$lib/server/db/schema';
import { signupSchema } from '$lib/schemas/auth';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	if (locals.session) redirect(303, '/home');

	const invitation = await loadValidInvite(params.token);
	return {
		form: await superValidate(zod4(signupSchema)),
		invite: { email: invitation.email, groupName: invitation.group.name }
	};
};

export const actions: Actions = {
	default: async (event) => {
		const invitation = await loadValidInvite(event.params.token);

		const form = await superValidate(event, zod4(signupSchema));
		if (!form.valid) return message(form, 'Confira os campos destacados.', { status: 400 });

		let userId: string;
		try {
			const result = await auth.api.signUpEmail({
				body: {
					email: invitation.email,
					password: form.data.password,
					name: form.data.name
				},
				headers: event.request.headers
			});
			userId = result.user.id;
		} catch (err) {
			if (err instanceof APIError) {
				return message(form, mapSignUpError(err), { status: 400 });
			}
			throw err;
		}

		await db.transaction(async (tx) => {
			await tx.insert(groupMember).values({
				groupId: invitation.groupId,
				memberId: userId,
				role: invitation.role
			});
			await tx.update(invite).set({ acceptedAt: new Date() }).where(eq(invite.id, invitation.id));
		});

		redirect(303, '/home');
	}
};

async function loadValidInvite(token: string | undefined) {
	if (!token) error(404, 'Convite não encontrado.');

	const row = await db.query.invite.findFirst({
		where: eq(invite.token, token),
		with: { group: true }
	});

	if (!row) error(404, 'Convite não encontrado.');
	if (row.acceptedAt) error(410, 'Este convite já foi utilizado.');
	if (row.expiresAt.getTime() < Date.now()) error(410, 'Este convite expirou.');

	return row;
}

function mapSignUpError(err: APIError) {
	if (err.status === 'UNPROCESSABLE_ENTITY') return 'Já existe uma conta com este e-mail.';
	return 'Não foi possível criar sua conta. Tente novamente.';
}
