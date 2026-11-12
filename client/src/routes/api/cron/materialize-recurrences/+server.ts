import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import { materializeDueRecurrences } from '$lib/server/recurrence';
import type { RequestHandler } from './$types';

function isAuthorizedCron(request: Request, secret: string) {
	const expected = `Bearer ${secret.trim()}`;
	const auth = request.headers.get('authorization')?.trim() ?? '';
	if (auth === expected) return true;

	const ua = request.headers.get('user-agent') ?? '';
	return ua.includes('vercel-cron') && auth.toLowerCase() === expected.toLowerCase();
}

/**
 * Vercel Cron — materializes due recurrence occurrences into concrete tasks.
 * Auth: `Authorization: Bearer <CRON_SECRET>`.
 */
export const GET: RequestHandler = async ({ request }) => {
	const secret = env.CRON_SECRET?.trim();
	if (!secret) {
		console.error('[cron/materialize-recurrences] CRON_SECRET missing');
		return json({ message: 'CRON_SECRET não configurado.' }, { status: 500 });
	}

	if (!isAuthorizedCron(request, secret)) {
		console.error('[cron/materialize-recurrences] unauthorized', {
			hasAuth: Boolean(request.headers.get('authorization')),
			ua: request.headers.get('user-agent')
		});
		return json({ message: 'Não autorizado.' }, { status: 401 });
	}

	try {
		const result = await materializeDueRecurrences();
		console.info('[cron/materialize-recurrences] ok', result);
		return json({
			ok: true,
			...result,
			at: new Date().toISOString()
		});
	} catch (err) {
		console.error('[cron/materialize-recurrences] failed', err);
		return json({ message: 'Falha ao materializar recorrências.' }, { status: 500 });
	}
};
