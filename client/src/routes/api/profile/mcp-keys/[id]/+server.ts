import { error, json } from '@sveltejs/kit';
import { revokeMcpKey } from '$lib/server/mcp/keys';
import type { RequestHandler } from './$types';

export const DELETE: RequestHandler = async ({ locals, params }) => {
	if (!locals.user) error(401, 'Não autenticado.');

	const result = await revokeMcpKey(locals.user.id, params.id);
	if (!result.ok) {
		return json({ message: result.message }, { status: result.status });
	}
	return json({ success: true });
};
