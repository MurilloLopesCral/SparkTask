import { redirect } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { APIError } from 'better-auth';
import { auth } from '$lib/server/auth';
import { loginSchema } from '$lib/schemas/auth';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.session) redirect(303, '/home');
	return { form: await superValidate(zod4(loginSchema)) };
};

export const actions: Actions = {
	default: async (event) => {
		const form = await superValidate(event, zod4(loginSchema));
		if (!form.valid) return message(form, 'Confira os campos destacados.', { status: 400 });

		try {
			await auth.api.signInEmail({
				body: { email: form.data.email, password: form.data.password },
				headers: event.request.headers
			});
		} catch (error) {
			if (error instanceof APIError) {
				return message(form, mapSignInError(error), { status: 400 });
			}
			throw error;
		}

		redirect(303, '/home');
	}
};

function mapSignInError(error: APIError) {
	if (error.status === 'FORBIDDEN') return 'Confirme seu e-mail antes de entrar.';
	return 'E-mail ou senha inválidos.';
}
