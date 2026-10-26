import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import { pauseExecutionsOutsideWorkHours } from '$lib/server/work-schedule';
import type { RequestHandler } from './$types';

/**
 * Vercel Cron — pauses open executions for users outside their work window.
 * Auth: `Authorization: Bearer <CRON_SECRET>` (set automatically by Vercel when CRON_SECRET exists).
 */
export const GET: RequestHandler = async ({ request }) => {
	const secret = env.CRON_SECRET;
	if (!secret) {
		return json({ message: 'CRON_SECRET não configurado.' }, { status: 500 });
	}

	const auth = request.headers.get('authorization');
	if (auth !== `Bearer ${secret}`) {
		return json({ message: 'Não autorizado.' }, { status: 401 });
	}

	const result = await pauseExecutionsOutsideWorkHours();
	return json({ ok: true, ...result, at: new Date().toISOString() });
};
