import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { getRequestEvent } from '$app/server';
import { env } from '$env/dynamic/private';
import { db } from './db';
import * as schema from './db/schema';
import { sendEmail } from './email';

export const auth = betterAuth({
	// Read via $env/dynamic/private rather than relying on better-auth's own
	// process.env lookup, which isn't reliably populated across SvelteKit's
	// build/adapter boundary.
	secret: env.BETTER_AUTH_SECRET,
	baseURL: env.BETTER_AUTH_URL,
	database: drizzleAdapter(db, {
		provider: 'pg',
		schema
	}),
	// Let Postgres generate ids (uuid().defaultRandom()) instead of better-auth's own id format.
	advanced: {
		database: {
			generateId: false
		}
	},
	emailAndPassword: {
		enabled: true,
		requireEmailVerification: true,
		sendResetPassword: async ({ user, url }) => {
			await sendEmail({
				to: [user.email],
				subject: 'Redefinir senha — SparkTask',
				html: `<p>Clique para redefinir sua senha: <a href="${url}">${url}</a></p><p>Se você não pediu isso, ignore este e-mail.</p>`
			});
		}
	},
	emailVerification: {
		sendOnSignUp: true,
		autoSignInAfterVerification: true,
		sendVerificationEmail: async ({ user, url }) => {
			await sendEmail({
				to: [user.email],
				subject: 'Confirme seu e-mail — SparkTask',
				html: `<p>Clique para confirmar seu e-mail: <a href="${url}">${url}</a></p>`
			});
		}
	},
	// Changing email reuses sendVerificationEmail above — the swap only takes
	// effect once the user clicks the link sent to the new address.
	user: {
		changeEmail: {
			enabled: true
		}
	},
	// Must be the last plugin — forwards Set-Cookie from server-side auth.api.*
	// calls (form actions) into SvelteKit's event.cookies automatically.
	plugins: [sveltekitCookies(getRequestEvent)]
});
