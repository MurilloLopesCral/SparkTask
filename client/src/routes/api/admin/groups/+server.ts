import { error, json } from '@sveltejs/kit';
import { z } from 'zod';
import {
	createGroupAndInviteOwner,
	createGroupWithOwner,
	listAllGroups,
	userIsSystemAdmin
} from '$lib/server/admin';
import type { RequestHandler } from './$types';

const createSchema = z.discriminatedUnion('mode', [
	z.object({
		mode: z.literal('existing'),
		name: z.string().trim().min(1).max(255),
		ownerUserId: z.string().uuid()
	}),
	z.object({
		mode: z.literal('invite'),
		name: z.string().trim().min(1).max(255),
		ownerEmail: z.email()
	})
]);

export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) error(401, 'Não autenticado.');
	if (!(await userIsSystemAdmin(locals.user.id))) error(403, 'Acesso restrito ao system admin.');

	const groups = await listAllGroups();
	return json({ groups });
};

export const POST: RequestHandler = async ({ request, locals, url }) => {
	if (!locals.user) error(401, 'Não autenticado.');
	if (!(await userIsSystemAdmin(locals.user.id))) error(403, 'Acesso restrito ao system admin.');

	const parsed = createSchema.safeParse(await request.json());
	if (!parsed.success) {
		return json({ message: 'Dados inválidos.', issues: parsed.error.issues }, { status: 400 });
	}

	if (parsed.data.mode === 'existing') {
		const result = await createGroupWithOwner({
			name: parsed.data.name,
			ownerUserId: parsed.data.ownerUserId
		});
		if (!result.ok) {
			return json({ message: result.message }, { status: result.status });
		}
		return json(
			{ mode: result.mode, group: result.group, owner: result.owner },
			{ status: 201 }
		);
	}

	const result = await createGroupAndInviteOwner({
		name: parsed.data.name,
		ownerEmail: parsed.data.ownerEmail,
		invitedByUserId: locals.user.id,
		origin: url.origin
	});

	if (!result.ok) {
		return json({ message: result.message }, { status: result.status });
	}

	return json(
		{
			mode: result.mode,
			group: result.group,
			invite: result.invite,
			signupUrl: result.signupUrl,
			emailSent: result.emailSent
		},
		{ status: 201 }
	);
};
