import type { RequestHandler } from './$types';
import { handleMcpHttp, mcpCorsHeaders } from '$lib/server/mcp/protocol';

function withCors(response: Response) {
	const headers = new Headers(response.headers);
	for (const [key, value] of Object.entries(mcpCorsHeaders())) {
		headers.set(key, value);
	}
	return new Response(response.body, {
		status: response.status,
		statusText: response.statusText,
		headers
	});
}

/** CORS preflight for remote MCP clients (Claude / Cursor / mcp-remote). */
export const OPTIONS: RequestHandler = async () =>
	new Response(null, { status: 204, headers: mcpCorsHeaders() });

/**
 * Stateless Streamable HTTP MCP endpoint.
 * Auth: `x-api-key: spk_…` (required). Optional: `x-spark-group-id` (must match key group).
 */
export const POST: RequestHandler = async ({ request }) => withCors(await handleMcpHttp(request));

/** Probe / health — clients sometimes GET the MCP URL first. */
export const GET: RequestHandler = async () =>
	withCors(
		Response.json({
			name: 'sparktask',
			transport: 'streamable-http',
			auth: {
				requiredHeaders: ['x-api-key'],
				optionalHeaders: ['x-spark-group-id']
			},
			hint: 'POST JSON-RPC (initialize | tools/list | tools/call). Crie a chave em Perfil → MCP.'
		})
	);
