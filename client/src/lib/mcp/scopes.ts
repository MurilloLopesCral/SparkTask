/** Capability scopes attached to an MCP access key. */
export const MCP_SCOPES = [
	'projects:read',
	'tasks:read',
	'tasks:write',
	'executions:write'
] as const;

export type McpScope = (typeof MCP_SCOPES)[number];

export const MCP_SCOPE_LABELS: Record<McpScope, string> = {
	'projects:read': 'Ler projetos',
	'tasks:read': 'Ler tarefas',
	'tasks:write': 'Criar/editar tarefas',
	'executions:write': 'Iniciar/pausar/finalizar execução'
};

export const DEFAULT_MCP_SCOPES: McpScope[] = [
	'projects:read',
	'tasks:read',
	'tasks:write',
	'executions:write'
];

export function isMcpScope(value: string): value is McpScope {
	return (MCP_SCOPES as readonly string[]).includes(value);
}

export function normalizeScopes(input: unknown): McpScope[] {
	if (!Array.isArray(input)) return [];
	const unique = new Set<McpScope>();
	for (const item of input) {
		if (typeof item === 'string' && isMcpScope(item)) unique.add(item);
	}
	return [...unique];
}

export function hasScope(scopes: readonly string[], required: McpScope) {
	return scopes.includes(required);
}
