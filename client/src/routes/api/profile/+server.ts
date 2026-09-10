import { error, json } from '@sveltejs/kit';
import { z } from 'zod';
import { APIError } from 'better-auth';
import { auth } from '$lib/server/auth';
import type { RequestHandler } from './$types';

const patchProfileSchema = z
	.object({
		name: z.string().min(1).max(60),
		email: z.email()
	})
	.partial();

/** PATCH /api/profile — updates the caller's own name and/or email.
 * Name applies immediately. An email change only takes effect once the
 * verification link sent to the new address is clicked. */
export const PATCH: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) error(401, 'Não autenticado.');

	const parsed = patchProfileSchema.safeParse(await request.json());
	if (!parsed.success) {
		return json({ message: 'Dados inválidos.', issues: parsed.error.issues }, { status: 400 });
	}
	if (Object.keys(parsed.data).length === 0) {
		return json({ message: 'Nada para atualizar.' }, { status: 400 });
	}

	let emailChangeRequested = false;

	try {
		if (parsed.data.name) {
			await auth.api.updateUser({
				body: { name: parsed.data.name },
				headers: request.headers
			});
		}

		if (parsed.data.email && parsed.data.email !== locals.user.email) {
			await auth.api.changeEmail({
				body: { newEmail: parsed.data.email },
				headers: request.headers
			});
			emailChangeRequested = true;
		}
	} catch (err) {
		if (err instanceof APIError) {
			return json(
				{ message: err.message ?? 'Não foi possível atualizar o perfil.' },
				{ status: 400 }
			);
		}
		throw err;
	}

	return json({ success: true, emailChangeRequested });
};
