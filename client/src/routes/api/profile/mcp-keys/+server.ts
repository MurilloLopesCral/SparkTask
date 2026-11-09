import { error, json } from '@sveltejs/kit';
import { z } from 'zod';
import { createMcpKey, listMcpKeysForUser } from '$lib/server/mcp/keys';
import { MCP_SCOPES } from '$lib/server/mcp/scopes';
import type { RequestHandler } from './$types';

const createSchema = z.object({
	name: z.string().trim().min(1).max(80),
	groupId: z.string().uuid(),
	scopes: z.array(z.enum(MCP_SCOPES)).min(1).optional()
});

export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) error(401, 'Não autenticado.');
	const keys = await listMcpKeysForUser(locals.user.id);
	return json({ keys });
};

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) error(401, 'Não autenticado.');

	const parsed = createSchema.safeParse(await request.json());
	if (!parsed.success) {
		return json({ message: 'Dados inválidos.', issues: parsed.error.issues }, { status: 400 });
	}

	const result = await createMcpKey({
		userId: locals.user.id,
		groupId: parsed.data.groupId,
		name: parsed.data.name,
		scopes: parsed.data.scopes
	});

	if (!result.ok) {
		return json({ message: result.message }, { status: result.status });
	}

	return json(
		{
			key: result.key,
			/** Shown once — store it in Claude Desktop / mcp-remote. */
			secret: result.secret
		},
		{ status: 201 }
	);
};
