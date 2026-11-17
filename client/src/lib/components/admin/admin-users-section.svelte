<script lang="ts">
	import * as Table from '$lib/components/ui/table/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import {
		searchAdminPlexusUsers,
		updateAdminUser,
		type PlexusUserOption
	} from '$lib/admin/api';
	import { formatDate } from '$lib/tasks/format';

	type AdminUser = {
		id: string;
		name: string | null;
		email: string;
		image: string | null;
		isActive: boolean;
		isSystemAdmin: boolean;
		plexusUserId: number | null;
		createdAt: Date | string;
	};

	let {
		directory,
		plexusReady
	}: {
		directory: AdminUser[];
		plexusReady: boolean;
	} = $props();

	let editOpen = $state(false);
	let editing = $state<AdminUser | null>(null);
	let submitting = $state(false);
	let togglingId = $state<string | null>(null);

	let searchQuery = $state('');
	let searchResults = $state.raw<PlexusUserOption[]>([]);
	let searching = $state(false);
	let selectedPlexus = $state<{ id: number; label: string } | null>(null);
	let searchTimer: ReturnType<typeof setTimeout> | null = null;

	function openEdit(user: AdminUser) {
		editing = user;
		selectedPlexus = user.plexusUserId
			? { id: user.plexusUserId, label: `Plexus #${user.plexusUserId}` }
			: null;
		searchQuery = '';
		searchResults = [];
		editOpen = true;
		if (plexusReady && !user.plexusUserId) void onSearchInput('');
	}

	function clearPlexusLink() {
		selectedPlexus = null;
		searchQuery = '';
		searchResults = [];
	}

	function onSearchInput(value: string) {
		searchQuery = value;
		if (searchTimer) clearTimeout(searchTimer);
		if (!plexusReady) return;

		searchTimer = setTimeout(async () => {
			searching = true;
			try {
				const results = await searchAdminPlexusUsers(value);
				searchResults = results ?? [];
			} finally {
				searching = false;
			}
		}, 300);
	}

	function pickPlexus(option: PlexusUserOption) {
		selectedPlexus = {
			id: option.id,
			label: `${option.name || 'Sem nome'} · ${option.email} (#${option.id})`
		};
		searchQuery = '';
		searchResults = [];
	}

	async function saveEdit(event: SubmitEvent) {
		event.preventDefault();
		if (!editing) return;

		const nextId = selectedPlexus?.id ?? null;
		const prevId = editing.plexusUserId;
		if (nextId === prevId) {
			editOpen = false;
			return;
		}

		submitting = true;
		try {
			const ok = await updateAdminUser(editing.id, { plexusUserId: nextId });
			if (ok) editOpen = false;
		} finally {
			submitting = false;
		}
	}

	async function toggleActive(user: AdminUser) {
		if (user.isSystemAdmin && user.isActive) return;
		togglingId = user.id;
		try {
			await updateAdminUser(user.id, { isActive: !user.isActive });
		} finally {
			togglingId = null;
		}
	}

</script>

<div class="flex flex-col gap-md">
	<p class="font-serif text-body-sm text-muted-foreground">
		Ative ou inative contas e vincule cada usuário Spark ao respectivo usuário no Plexus (obrigatório
		para sync de gantts).
	</p>

	{#if !plexusReady}
		<p class="border border-frame bg-muted/40 px-md py-sm font-serif text-caption text-muted-foreground">
			Plexus não configurado neste ambiente — o vínculo pode ser salvo manualmente depois; a busca
			automática fica indisponível.
		</p>
	{/if}

	{#if directory.length === 0}
		<p class="font-serif text-body-sm text-muted-foreground">Nenhum usuário cadastrado.</p>
	{:else}
		<ul class="flex flex-col gap-sm md:hidden">
			{#each directory as u (u.id)}
				<li class="flex flex-col gap-sm border border-frame bg-canvas p-md">
					<div class="flex items-start justify-between gap-sm">
						<div class="min-w-0">
							<p class="truncate font-sans font-medium uppercase">{u.name || 'Sem nome'}</p>
							<p class="truncate font-serif text-caption text-muted-foreground">{u.email}</p>
						</div>
						<div class="flex flex-col items-end gap-xxs">
							<Badge variant={u.isActive ? 'secondary' : 'destructive'}>
								{u.isActive ? 'Ativo' : 'Inativo'}
							</Badge>
							{#if u.isSystemAdmin}
								<Badge variant="outline">SysAdmin</Badge>
							{/if}
						</div>
					</div>
					<p class="font-serif text-caption text-muted-foreground">
						Plexus: {u.plexusUserId != null ? `#${u.plexusUserId}` : '—'} · Criado
						{formatDate(u.createdAt)}
					</p>
					<div class="flex flex-wrap gap-sm">
						<Button type="button" variant="outline" class="min-h-11" onclick={() => openEdit(u)}>
							Vincular Plexus
						</Button>
						{#if !u.isSystemAdmin}
							<Button
								type="button"
								variant="outline"
								class="min-h-11"
								disabled={togglingId === u.id}
								onclick={() => toggleActive(u)}
							>
								{u.isActive ? 'Inativar' : 'Reativar'}
							</Button>
						{/if}
					</div>
				</li>
			{/each}
		</ul>

		<div class="hidden md:block">
			<Table.Root class="data-table">
				<Table.Header>
					<Table.Row>
						<Table.Head>Usuário</Table.Head>
						<Table.Head>Plexus</Table.Head>
						<Table.Head>Status</Table.Head>
						<Table.Head>Criado</Table.Head>
						<Table.Head></Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each directory as u (u.id)}
						<Table.Row>
							<Table.Cell>
								<span class="block font-sans font-medium uppercase">{u.name || 'Sem nome'}</span>
								<span class="font-serif text-caption text-muted-foreground">{u.email}</span>
								{#if u.isSystemAdmin}
									<span class="mt-xxs inline-block">
										<Badge variant="outline">SysAdmin</Badge>
									</span>
								{/if}
							</Table.Cell>
							<Table.Cell class="font-mono text-body-sm">
								{u.plexusUserId != null ? `#${u.plexusUserId}` : '—'}
							</Table.Cell>
							<Table.Cell>
								<Badge variant={u.isActive ? 'secondary' : 'destructive'}>
									{u.isActive ? 'Ativo' : 'Inativo'}
								</Badge>
							</Table.Cell>
							<Table.Cell>{formatDate(u.createdAt)}</Table.Cell>
							<Table.Cell>
								<div class="flex flex-wrap items-center gap-sm">
									<Button type="button" variant="outline" size="sm" onclick={() => openEdit(u)}>
										Vincular
									</Button>
									{#if !u.isSystemAdmin}
										<Button
											type="button"
											variant="outline"
											size="sm"
											disabled={togglingId === u.id}
											onclick={() => toggleActive(u)}
										>
											{u.isActive ? 'Inativar' : 'Reativar'}
										</Button>
									{/if}
								</div>
							</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		</div>
	{/if}
</div>

<Sheet.Root
	bind:open={editOpen}
	onOpenChange={(next) => {
		if (!next) {
			editing = null;
			searchResults = [];
		}
	}}
>
	<Sheet.Content class="flex w-full flex-col sm:max-w-[26rem]">
		{#if editing}
			<form onsubmit={saveEdit} class="flex h-full flex-col">
				<Sheet.Header>
					<Sheet.Title>Vínculo Plexus</Sheet.Title>
					<Sheet.Description>
						{editing.name || 'Sem nome'} · {editing.email}
					</Sheet.Description>
				</Sheet.Header>

				<div class="flex flex-1 flex-col gap-md overflow-y-auto px-lg">
					{#if selectedPlexus}
						<div class="flex flex-col gap-sm border border-frame bg-muted/40 p-md">
							<p class="font-sans text-ui-label uppercase">Selecionado</p>
							<p class="font-serif text-body-sm">{selectedPlexus.label}</p>
							<Button type="button" variant="outline" class="min-h-11" onclick={clearPlexusLink}>
								Remover vínculo
							</Button>
						</div>
					{:else if plexusReady}
						<label class="flex flex-col gap-xxs">
							<span class="font-sans text-ui-label uppercase">Buscar no Plexus</span>
							<input
								class="text-input min-h-11"
								type="search"
								autocomplete="off"
								placeholder="Nome ou função…"
								value={searchQuery}
								oninput={(e) => onSearchInput(e.currentTarget.value)}
							/>
							<span class="font-serif text-caption text-muted-foreground">
								Usa GET /service/v1/users (escopo users:read).
							</span>
						</label>

						{#if searching}
							<p class="font-serif text-caption text-muted-foreground">Buscando…</p>
						{:else if searchResults.length === 0}
							<p class="font-serif text-caption text-muted-foreground">Nenhum resultado.</p>
						{:else}
							<ul class="flex flex-col gap-xxs border border-frame" role="listbox">
								{#each searchResults as option (option.id)}
									<li>
										<button
											type="button"
											class="flex min-h-11 w-full flex-col items-start gap-xxs px-md py-sm text-left hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
											onclick={() => pickPlexus(option)}
										>
											<span class="font-sans text-sm font-medium">
												{option.name || 'Sem nome'}
												<span class="font-mono text-caption text-muted-foreground">
													#{option.id}
												</span>
											</span>
											<span class="font-serif text-caption text-muted-foreground">
												{option.email}
												{#if option.function}
													· {option.function}
												{/if}
											</span>
										</button>
									</li>
								{/each}
							</ul>
						{/if}
					{:else}
						<p class="font-serif text-body-sm text-muted-foreground">
							Configure PLEXUS_API_BASE_URL e PLEXUS_SERVICE_KEY para buscar usuários.
						</p>
					{/if}
				</div>

				<Sheet.Footer>
					<Button type="submit" disabled={submitting} class="min-h-11 w-full">
						{submitting ? 'Salvando…' : 'Salvar'}
					</Button>
				</Sheet.Footer>
			</form>
		{/if}
	</Sheet.Content>
</Sheet.Root>
