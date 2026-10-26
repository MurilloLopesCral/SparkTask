import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import { pauseExecutionsOutsideWorkHours } from '$lib/server/work-schedule';
import type { RequestHandler } from './$types';

function isAuthorizedCron(request: Request, secret: string) {
	const expected = `Bearer ${secret.trim()}`;
	const auth = request.headers.get('authorization')?.trim() ?? '';
	if (auth === expected) return true;

	// Fallback: Vercel always sends this UA on cron invocations.
	const ua = request.headers.get('user-agent') ?? '';
	return ua.includes('vercel-cron') && auth.toLowerCase() === expected.toLowerCase();
}

/**
 * Vercel Cron — pauses open executions for users outside their work window.
 * Auth: `Authorization: Bearer <CRON_SECRET>` (sent by Vercel when CRON_SECRET is set).
 *
 * Hobby: schedule runs once/day — see vercel.json. The tasks page load also
 * pauses the current user as a safety net.
 */
export const GET: RequestHandler = async ({ request }) => {
	const secret = env.CRON_SECRET?.trim();
	if (!secret) {
		console.error('[cron/pause-after-hours] CRON_SECRET missing');
		return json({ message: 'CRON_SECRET não configurado.' }, { status: 500 });
	}

	if (!isAuthorizedCron(request, secret)) {
		console.error('[cron/pause-after-hours] unauthorized', {
			hasAuth: Boolean(request.headers.get('authorization')),
			ua: request.headers.get('user-agent')
		});
		return json({ message: 'Não autorizado.' }, { status: 401 });
	}

	try {
		const result = await pauseExecutionsOutsideWorkHours();
		console.info('[cron/pause-after-hours] ok', result);
		return json({
			ok: true,
			...result,
			at: new Date().toISOString(),
			schedule: request.headers.get('x-vercel-cron-schedule')
		});
	} catch (err) {
		console.error('[cron/pause-after-hours] failed', err);
		return json({ message: 'Falha ao pausar execuções.' }, { status: 500 });
	}
};
