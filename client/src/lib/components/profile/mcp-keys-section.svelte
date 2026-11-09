<script lang="ts">
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import {
		DEFAULT_MCP_SCOPES,
		MCP_SCOPE_LABELS,
		MCP_SCOPES,
		type McpScope
	} from '$lib/mcp/scopes';
	import {
		createMcpAccessKey,
		revokeMcpAccessKey,
		type McpKeyListItem
	} from '$lib/users/mcp-keys-api';
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import { Copy01Icon, Delete02Icon, Key01Icon } from '@hugeicons/core-free-icons';
	import { toast } from 'svelte-sonner';

	type GroupOption = { id: string; name: string; role: string };

	let {
		keys,
		groups
	}: {
		keys: McpKeyListItem[];
		groups: GroupOption[];
	} = $props();

	let name = $state('Claude Desktop');
	/** Undefined until the user picks — falls back to first group. */
	let groupId = $state<string | undefined>(undefined);
	let scopes = $state<McpScope[]>([...DEFAULT_MCP_SCOPES]);
	let creating = $state(false);
	let revokingId = $state<string | null>(null);
	let freshSecret = $state<string | null>(null);
	let copied = $state(false);

	const selectedGroupId = $derived(
		groupId && groups.some((g) => g.id === groupId) ? groupId : (groups[0]?.id ?? '')
	);
	const origin = $derived(page.url.origin);
	const mcpUrl = $derived(`${origin}/api/mcp`);

	const claudeSnippet = $derived.by(() => {
		const key = freshSecret ?? 'spk_COLE_SUA_CHAVE_AQUI';
		return JSON.stringify(
			{
				mcpServers: {
					sparktask: {
						command: 'npx',
						args: [
							'-y',
							'mcp-remote',
							mcpUrl,
							'--header',
							`x-api-key:${key}`
						]
					}
				}
			},
			null,
			2
		);
	});

	function toggleScope(scope: McpScope) {
		if (scopes.includes(scope)) {
			scopes = scopes.filter((s) => s !== scope);
		} else {
			scopes = [...scopes, scope];
		}
	}

	async function handleCreate(event: SubmitEvent) {
		event.preventDefault();
		if (!name.trim() || !selectedGroupId || scopes.length === 0) {
			toast.error('Preencha nome, grupo e ao menos um escopo.');
			return;
		}

		creating = true;
		freshSecret = null;
		copied = false;
		try {
			const result = await createMcpAccessKey({
				name: name.trim(),
				groupId: selectedGroupId,
				scopes
			});
			if (result?.secret) freshSecret = result.secret;
		} finally {
			creating = false;
		}
	}

	async function handleRevoke(id: string) {
		if (!confirm('Revogar esta chave? Integrações que a usam param imediatamente.')) return;
		revokingId = id;
		try {
			await revokeMcpAccessKey(id);
			if (freshSecret) freshSecret = null;
		} finally {
			revokingId = null;
		}
	}

	async function copyText(text: string, okMessage: string) {
		try {
			await navigator.clipboard.writeText(text);
			copied = true;
			toast.success(okMessage);
		} catch {
			toast.error('Não foi possível copiar.');
		}
	}

	function formatDate(value: string | Date | null | undefined) {
		if (!value) return '—';
		const d = typeof value === 'string' ? new Date(value) : value;
		if (Number.isNaN(d.getTime())) return '—';
		return d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
	}
</script>

<section
	class="flex flex-col gap-md border-t border-frame pt-lg"
	aria-labelledby="mcp-keys-heading"
>
	<div class="flex flex-col gap-xxs">
		<div class="flex items-center gap-sm">
			<HugeiconsIcon icon={Key01Icon} strokeWidth={2} class="size-5 shrink-0" aria-hidden="true" />
			<h2 id="mcp-keys-heading" class="font-display text-h2 uppercase scroll-mt-lg">
				MCP / agentes
			</h2>
		</div>
		<p class="font-serif text-body-sm text-muted-foreground">
			Crie uma chave atrelada a um grupo. No Claude Desktop use o cabeçalho
			<code class="font-mono text-caption">x-api-key</code>
			— o grupo já vem da chave.
		</p>
	</div>

	{#if groups.length === 0}
		<p class="font-serif text-body-sm text-muted-foreground">
			Entre em um grupo antes de gerar chaves MCP.
		</p>
	{:else}
		<form onsubmit={handleCreate} class="flex flex-col gap-md">
			<label class="flex flex-col gap-xxs">
				<span class="font-sans text-ui-label uppercase">Nome da chave</span>
				<input
					class="text-input min-h-11"
					name="mcpKeyName"
					autocomplete="off"
					bind:value={name}
					maxlength={80}
					required
				/>
			</label>

			<label class="flex flex-col gap-xxs">
				<span class="font-sans text-ui-label uppercase">Grupo</span>
				<select
					class="text-input min-h-11"
					name="mcpGroupId"
					value={selectedGroupId}
					onchange={(e) => {
						groupId = e.currentTarget.value;
					}}
					required
				>
					{#each groups as group (group.id)}
						<option value={group.id}>{group.name}</option>
					{/each}
				</select>
				<span class="font-serif text-caption text-muted-foreground">
					O agente só enxerga projetos e tarefas deste grupo. ID:
					<code class="font-mono">{selectedGroupId || '—'}</code>
				</span>
			</label>

			<fieldset class="flex flex-col gap-xs">
				<legend class="font-sans text-ui-label uppercase">Escopos</legend>
				<p class="font-serif text-caption text-muted-foreground">
					Escolha o que o agente pode fazer com esta chave.
				</p>
				<div class="flex flex-col gap-xs" role="group" aria-label="Escopos da chave">
					{#each MCP_SCOPES as scope (scope)}
						{@const pressed = scopes.includes(scope)}
						<label class="flex min-h-11 cursor-pointer items-center gap-sm">
							<input
								type="checkbox"
								class="size-4 accent-dell-red"
								checked={pressed}
								onchange={() => toggleScope(scope)}
							/>
							<span class="font-sans text-ui-label">{MCP_SCOPE_LABELS[scope]}</span>
							<span class="font-mono text-caption text-muted-foreground">{scope}</span>
						</label>
					{/each}
				</div>
			</fieldset>

			<Button type="submit" disabled={creating || scopes.length === 0} class="min-h-11 w-full sm:w-fit">
				{creating ? 'Gerando…' : 'Gerar chave'}
			</Button>
		</form>
	{/if}

	{#if freshSecret}
		<div
			class="flex flex-col gap-sm border border-frame bg-muted/40 p-md transition-opacity duration-200"
			role="status"
		>
			<p class="font-sans text-ui-label uppercase text-dell-red">Copie agora — some ao sair</p>
			<div class="flex flex-col gap-xs sm:flex-row sm:items-center">
				<code class="font-mono text-body-sm break-all">{freshSecret}</code>
				<Button
					type="button"
					variant="outline"
					class="min-h-11 shrink-0"
					onclick={() => copyText(freshSecret!, 'Chave copiada.')}
				>
					<HugeiconsIcon icon={Copy01Icon} strokeWidth={2} class="size-4" aria-hidden="true" />
					{copied ? 'Copiada' : 'Copiar chave'}
				</Button>
			</div>

			<details class="group">
				<summary
					class="cursor-pointer font-sans text-ui-label uppercase focus-visible:ring-2 focus-visible:ring-frame focus-visible:outline-none"
				>
					Config Claude Desktop (mcp-remote)
				</summary>
				<div class="mt-sm flex flex-col gap-xs">
					<pre
						class="overflow-x-auto border border-frame bg-background p-sm font-mono text-caption whitespace-pre-wrap"
					>{claudeSnippet}</pre>
					<Button
						type="button"
						variant="outline"
						class="min-h-11 w-full sm:w-fit"
						onclick={() => copyText(claudeSnippet, 'Snippet copiado.')}
					>
						Copiar snippet
					</Button>
					<p class="font-serif text-caption text-muted-foreground">
						Endpoint: <code class="font-mono">{mcpUrl}</code>. Cole em
						<code class="font-mono">claude_desktop_config.json</code>
						e reinicie o Claude.
					</p>
				</div>
			</details>
		</div>
	{/if}

	<div class="flex flex-col gap-sm">
		<h3 class="font-sans text-ui-label uppercase">Chaves ativas</h3>
		{#if keys.length === 0}
			<p class="font-serif text-body-sm text-muted-foreground">Nenhuma chave ainda.</p>
		{:else}
			<ul class="flex flex-col gap-sm">
				{#each keys as key (key.id)}
					<li
						class="flex flex-col gap-sm border border-frame p-md transition-colors duration-150 sm:flex-row sm:items-start sm:justify-between"
					>
						<div class="flex min-w-0 flex-col gap-xs">
							<div class="flex flex-wrap items-center gap-xs">
								<span class="font-sans text-body uppercase">{key.name}</span>
								<Badge variant="secondary">{key.groupName}</Badge>
							</div>
							<p class="font-mono text-caption text-muted-foreground">
								{key.keyPrefix}… · criada {formatDate(key.createdAt)} · último uso
								{formatDate(key.lastUsedAt)}
							</p>
							<div class="flex flex-wrap gap-xs">
								{#each key.scopes as scope (scope)}
									<span class="badge-sticker bg-muted px-sm py-xxs font-mono text-caption"
										>{scope}</span
									>
								{/each}
							</div>
						</div>
						<Button
							type="button"
							variant="outline"
							class="min-h-11 shrink-0 text-destructive"
							disabled={revokingId === key.id}
							onclick={() => handleRevoke(key.id)}
						>
							<HugeiconsIcon icon={Delete02Icon} strokeWidth={2} class="size-4" aria-hidden="true" />
							{revokingId === key.id ? 'Revogando…' : 'Revogar'}
						</Button>
					</li>
				{/each}
			</ul>
		{/if}
	</div>
</section>
