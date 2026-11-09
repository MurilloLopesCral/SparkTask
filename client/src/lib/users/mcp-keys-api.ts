import { invalidateAll } from '$app/navigation';
import { toast } from 'svelte-sonner';
import type { McpScope } from '$lib/mcp/scopes';

export type McpKeyListItem = {
	id: string;
	name: string;
	keyPrefix: string;
	groupId: string;
	groupName: string;
	scopes: string[];
	lastUsedAt: string | Date | null;
	createdAt: string | Date;
};

export async function createMcpAccessKey(input: {
	name: string;
	groupId: string;
	scopes: McpScope[];
}) {
	const res = await fetch('/api/profile/mcp-keys', {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify(input)
	});
	const data = await res.json().catch(() => ({}));

	if (!res.ok) {
		toast.error(data.message ?? 'Não foi possível criar a chave.');
		return null;
	}

	await invalidateAll();
	toast.success('Chave criada. Copie agora — ela não aparece de novo.');
	return data as { key: McpKeyListItem; secret: string };
}

export async function revokeMcpAccessKey(id: string) {
	const res = await fetch(`/api/profile/mcp-keys/${id}`, { method: 'DELETE' });
	const data = await res.json().catch(() => ({}));
	await invalidateAll();

	if (!res.ok) {
		toast.error(data.message ?? 'Não foi possível revogar a chave.');
		return false;
	}
	toast.success('Chave revogada.');
	return true;
}
