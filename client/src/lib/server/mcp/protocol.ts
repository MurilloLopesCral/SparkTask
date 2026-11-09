import { authenticateMcpRequest } from './keys';
import { callMcpTool, MCP_TOOLS } from './tools';

const PROTOCOL_VERSION = '2025-03-26';
const SERVER_INFO = { name: 'sparktask', version: '0.1.0' };

type JsonRpcId = string | number | null;

type JsonRpcRequest = {
	jsonrpc?: string;
	id?: JsonRpcId;
	method?: string;
	params?: Record<string, unknown>;
};

function rpcResult(id: JsonRpcId | undefined, result: unknown) {
	return { jsonrpc: '2.0', id: id ?? null, result };
}

function rpcError(id: JsonRpcId | undefined, code: number, message: string) {
	return { jsonrpc: '2.0', id: id ?? null, error: { code, message } };
}

function listToolsPayload() {
	return {
		tools: MCP_TOOLS.map((tool) => ({
			name: tool.name,
			description: tool.description,
			inputSchema: tool.inputSchema
		}))
	};
}

async function handleSingle(
	message: JsonRpcRequest,
	request: Request
): Promise<Record<string, unknown> | null> {
	const method = message.method;
	if (!method) return rpcError(message.id, -32600, 'Request inválido.');

	// Notifications have no id and need no response body entry.
	const isNotification = message.id === undefined;

	if (method === 'notifications/initialized' || method === 'notifications/cancelled') {
		return null;
	}

	if (method === 'initialize') {
		return rpcResult(message.id, {
			protocolVersion: PROTOCOL_VERSION,
			capabilities: { tools: { listChanged: false } },
			serverInfo: SERVER_INFO
		});
	}

	if (method === 'ping') {
		return rpcResult(message.id, {});
	}

	const auth = await authenticateMcpRequest(request);
	if (!auth.ok) {
		return rpcError(message.id, -32001, auth.message);
	}

	if (method === 'tools/list') {
		return rpcResult(message.id, listToolsPayload());
	}

	if (method === 'tools/call') {
		const params = message.params ?? {};
		const name = typeof params.name === 'string' ? params.name : '';
		const args = params.arguments;
		const result = await callMcpTool(auth.ctx, name, args);
		return rpcResult(message.id, result);
	}

	if (isNotification) return null;
	return rpcError(message.id, -32601, `Método não suportado: ${method}`);
}

export async function handleMcpHttp(request: Request): Promise<Response> {
	const accept = request.headers.get('accept') ?? '';
	const wantsJson = accept.includes('application/json') || accept === '' || accept.includes('*/*');

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return Response.json(rpcError(null, -32700, 'JSON inválido.'), { status: 400 });
	}

	const messages = Array.isArray(body) ? body : [body];
	const responses: Record<string, unknown>[] = [];

	for (const message of messages) {
		if (!message || typeof message !== 'object') {
			responses.push(rpcError(null, -32600, 'Request inválido.'));
			continue;
		}
		const result = await handleSingle(message as JsonRpcRequest, request);
		if (result) responses.push(result);
	}

	// Pure notifications → 202 Accepted with empty body (Streamable HTTP).
	if (responses.length === 0) {
		return new Response(null, { status: 202 });
	}

	const payload = Array.isArray(body) ? responses : responses[0];

	if (!wantsJson && accept.includes('text/event-stream')) {
		const frames = (Array.isArray(payload) ? payload : [payload])
			.map((item) => `event: message\ndata: ${JSON.stringify(item)}\n\n`)
			.join('');
		return new Response(frames, {
			status: 200,
			headers: {
				'content-type': 'text/event-stream; charset=utf-8',
				'cache-control': 'no-cache',
				connection: 'keep-alive'
			}
		});
	}

	return Response.json(payload);
}

export function mcpCorsHeaders() {
	return {
		'Access-Control-Allow-Origin': '*',
		'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, DELETE',
		'Access-Control-Allow-Headers':
			'Content-Type, Accept, Authorization, X-API-Key, x-api-key, x-spark-group-id, Mcp-Session-Id, MCP-Protocol-Version',
		'Access-Control-Expose-Headers': 'Mcp-Session-Id, MCP-Protocol-Version'
	};
}
