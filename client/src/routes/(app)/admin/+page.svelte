<script lang="ts">
	import { page } from '$app/state';
	import { toast } from 'svelte-sonner';
	import { Copy } from '@lucide/svelte';
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import { Add01Icon } from '@hugeicons/core-free-icons';
	import * as Table from '$lib/components/ui/table/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { createAdminGroup, setAdminGroupActive } from '$lib/admin/api';
	import { formatDate } from '$lib/tasks/format';
	import type { PageProps } from './$types';

	type OwnerMode = 'existing' | 'invite';

	let { data }: PageProps = $props();

	let open = $state(false);
	let submitting = $state(false);
	let togglingId = $state<string | null>(null);
	let ownerMode = $state<OwnerMode>('existing');
	let form = $state({ name: '', ownerUserId: '', ownerEmail: '' });
	let lastInvite = $state<{ signupUrl: string; email: string; emailSent: boolean } | null>(null);

	const selectedOwner = $derived(data.users.find((u) => u.id === form.ownerUserId));
	const ownerLabel = $derived(
		selectedOwner
			? `${selectedOwner.name || 'Sem nome'} · ${selectedOwner.email}`
			: 'Selecione o owner'
	);

	function resetForm() {
		form = { name: '', ownerUserId: '', ownerEmail: '' };
		ownerMode = 'existing';
		lastInvite = null;
	}

	async function handleCreate(event: SubmitEvent) {
		event.preventDefault();
		if (!form.name.trim()) {
			toast.error('Informe o nome do grupo.');
			return;
		}

		submitting = true;
		lastInvite = null;
		try {
			if (ownerMode === 'existing') {
				if (!form.ownerUserId) {
					toast.error('Selecione o owner.');
					return;
				}
				const result = await createAdminGroup({
					mode: 'existing',
					name: form.name.trim(),
					ownerUserId: form.ownerUserId
				});
				if (!result) return;
				resetForm();
				open = false;
				return;
			}

			if (!form.ownerEmail.trim()) {
				toast.error('Informe o e-mail do owner.');
				return;
			}

			const result = await createAdminGroup({
				mode: 'invite',
				name: form.name.trim(),
				ownerEmail: form.ownerEmail.trim()
			});
			if (!result || result.mode !== 'invite') return;

			lastInvite = {
				signupUrl: result.signupUrl,
				email: result.invite.email,
				emailSent: result.emailSent
			};
			form = { name: '', ownerUserId: '', ownerEmail: '' };
		} finally {
			submitting = false;
		}
	}

	async function toggleActive(groupId: string, next: boolean) {
		togglingId = groupId;
		try {
			await setAdminGroupActive(groupId, next);
		} finally {
			togglingId = null;
		}
	}

	async function copyText(text: string, okMessage: string) {
		try {
			await navigator.clipboard.writeText(text);
			toast.success(okMessage);
		} catch {
			toast.error('Não foi possível copiar.');
		}
	}

	function ownerInviteUrl(token: string) {
		return `${page.url.origin}/signup/${token}`;
	}

	function ownerCell(g: (typeof data.groups)[number]) {
		if (g.owners.length > 0) {
			return g.owners.map((o) => o.name || o.email).join(', ');
		}
		if (g.pendingOwnerInvites.length > 0) {
			return `Convite: ${g.pendingOwnerInvites.map((i) => i.email).join(', ')}`;
		}
		return '—';
	}
</script>

<svelte:head><title>Admin — SparkTask</title></svelte:head>

<div class="p-md pb-[max(1rem,env(safe-area-inset-bottom))] md:p-lg lg:p-section">
	<div
		class="mb-lg flex flex-col gap-md sm:flex-row sm:flex-wrap sm:items-center sm:justify-between"
	>
		<div class="flex flex-col gap-xxs">
			<h1 class="font-display text-h1 text-pretty uppercase">Admin</h1>
			<p class="font-serif text-body-sm text-muted-foreground">
				Crie grupos com owner existente ou convide um novo owner por e-mail.
			</p>
		</div>

		<Sheet.Root
			bind:open
			onOpenChange={(next) => {
				if (!next) resetForm();
			}}
		>
			<Sheet.Trigger>
				{#snippet child({ props })}
					<Button {...props} class="min-h-11">
						<HugeiconsIcon icon={Add01Icon} strokeWidth={2} />
						Novo grupo
					</Button>
				{/snippet}
			</Sheet.Trigger>
			<Sheet.Content class="flex w-full flex-col sm:max-w-[24rem]">
				<form onsubmit={handleCreate} class="flex h-full flex-col">
					<Sheet.Header>
						<Sheet.Title>Novo grupo</Sheet.Title>
						<Sheet.Description>
							Escolha um usuário já cadastrado ou envie um convite de owner para um e-mail novo.
						</Sheet.Description>
					</Sheet.Header>

					<div class="flex flex-1 flex-col gap-md overflow-y-auto px-lg">
						{#if lastInvite}
							<div class="flex flex-col gap-sm border border-frame bg-muted/40 p-md" role="status">
								<p class="font-sans text-ui-label uppercase">
									{lastInvite.emailSent ? 'Convite enviado' : 'Copie o link do convite'}
								</p>
								<p class="font-serif text-body-sm text-muted-foreground">
									Owner: <strong>{lastInvite.email}</strong>. Ao criar a conta, a pessoa vira
									owner do grupo.
								</p>
								<code class="break-all font-mono text-caption">{lastInvite.signupUrl}</code>
								<Button
									type="button"
									variant="outline"
									class="min-h-11 w-full"
									onclick={() => copyText(lastInvite!.signupUrl, 'Link copiado.')}
								>
									<Copy class="size-4" />
									Copiar link
								</Button>
								<Button
									type="button"
									class="min-h-11 w-full"
									onclick={() => {
										resetForm();
										open = false;
									}}
								>
									Fechar
								</Button>
							</div>
						{:else}
							<label class="flex flex-col gap-xxs">
								<span class="font-sans text-ui-label uppercase">Nome do grupo</span>
								<input
									class="text-input min-h-11"
									name="groupName"
									autocomplete="off"
									bind:value={form.name}
									required
									maxlength={255}
								/>
							</label>

							<fieldset class="flex flex-col gap-xs">
								<legend class="font-sans text-ui-label uppercase">Owner</legend>
								<div class="flex flex-col gap-xs" role="radiogroup" aria-label="Tipo de owner">
									<label class="flex min-h-11 cursor-pointer items-center gap-sm">
										<input
											type="radio"
											class="size-4 accent-dell-red"
											name="ownerMode"
											value="existing"
											checked={ownerMode === 'existing'}
											onchange={() => (ownerMode = 'existing')}
										/>
										<span class="font-serif text-body-sm">Usuário existente</span>
									</label>
									<label class="flex min-h-11 cursor-pointer items-center gap-sm">
										<input
											type="radio"
											class="size-4 accent-dell-red"
											name="ownerMode"
											value="invite"
											checked={ownerMode === 'invite'}
											onchange={() => (ownerMode = 'invite')}
										/>
										<span class="font-serif text-body-sm">Convidar por e-mail</span>
									</label>
								</div>
							</fieldset>

							{#if ownerMode === 'existing'}
								<label class="flex flex-col gap-xxs">
									<span class="font-sans text-ui-label uppercase">Usuário</span>
									<Select.Root type="single" bind:value={form.ownerUserId}>
										<Select.Trigger class="min-h-11 w-full">{ownerLabel}</Select.Trigger>
										<Select.Content>
											{#each data.users as u (u.id)}
												<Select.Item
													value={u.id}
													label={`${u.name || 'Sem nome'} · ${u.email}`}
												/>
											{/each}
										</Select.Content>
									</Select.Root>
								</label>
							{:else}
								<label class="flex flex-col gap-xxs">
									<span class="font-sans text-ui-label uppercase">E-mail do owner</span>
									<input
										type="email"
										class="text-input min-h-11"
										name="ownerEmail"
										autocomplete="email"
										bind:value={form.ownerEmail}
										required
									/>
									<span class="font-serif text-caption text-muted-foreground">
										Enviamos um link de cadastro. Sem conta ainda — ela nasce como owner.
									</span>
								</label>
							{/if}
						{/if}
					</div>

					{#if !lastInvite}
						<Sheet.Footer>
							<Button type="submit" disabled={submitting} class="min-h-11 w-full">
								{submitting
									? 'Criando…'
									: ownerMode === 'invite'
										? 'Criar e convidar'
										: 'Criar grupo'}
							</Button>
						</Sheet.Footer>
					{/if}
				</form>
			</Sheet.Content>
		</Sheet.Root>
	</div>

	<h2 class="mb-sm font-sans text-h3 uppercase">Grupos</h2>

	{#if data.groups.length === 0}
		<p class="font-serif text-body-sm text-muted-foreground">Nenhum grupo ainda.</p>
	{:else}
		<ul class="mb-xl flex flex-col gap-sm md:hidden">
			{#each data.groups as g (g.id)}
				<li class="flex flex-col gap-sm border border-frame bg-canvas p-md">
					<div class="flex items-start justify-between gap-sm">
						<div class="min-w-0">
							<p class="truncate font-sans font-medium uppercase">{g.name}</p>
							<p class="font-mono text-caption text-muted-foreground">{g.id}</p>
						</div>
						<Badge variant={g.isActive ? 'secondary' : 'destructive'}>
							{g.isActive ? 'Ativo' : 'Inativo'}
						</Badge>
					</div>
					<p class="font-serif text-caption text-muted-foreground">
						Owner: {ownerCell(g)} · Criado {formatDate(g.createdAt)}
					</p>
					{#if g.pendingOwnerInvites.length > 0}
						{#each g.pendingOwnerInvites as inv (inv.id)}
							<Button
								type="button"
								variant="outline"
								class="min-h-11 w-full"
								onclick={() =>
									copyText(ownerInviteUrl(inv.token), 'Link do convite copiado.')}
							>
								<Copy class="size-4" />
								Copiar convite ({inv.email})
							</Button>
						{/each}
					{/if}
					<div class="flex flex-wrap gap-sm">
						<Button
							type="button"
							variant="outline"
							class="min-h-11"
							onclick={() => copyText(g.id, 'ID do grupo copiado.')}
						>
							<Copy class="size-4" />
							Copiar ID
						</Button>
						<Button
							type="button"
							variant="outline"
							class="min-h-11"
							disabled={togglingId === g.id}
							onclick={() => toggleActive(g.id, !g.isActive)}
						>
							{g.isActive ? 'Desativar' : 'Reativar'}
						</Button>
					</div>
				</li>
			{/each}
		</ul>

		<div class="hidden md:block">
			<Table.Root class="data-table">
				<Table.Header>
					<Table.Row>
						<Table.Head>Nome</Table.Head>
						<Table.Head>Owner</Table.Head>
						<Table.Head>Status</Table.Head>
						<Table.Head>Criado</Table.Head>
						<Table.Head></Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each data.groups as g (g.id)}
						<Table.Row>
							<Table.Cell>
								<span class="block font-sans font-medium uppercase">{g.name}</span>
								<span class="font-mono text-caption text-muted-foreground">{g.id}</span>
							</Table.Cell>
							<Table.Cell class="font-serif text-body-sm">
								{ownerCell(g)}
								{#if g.pendingOwnerInvites.length > 0}
									<div class="mt-xxs flex flex-wrap gap-xs">
										{#each g.pendingOwnerInvites as inv (inv.id)}
											<Button
												type="button"
												variant="outline"
												size="sm"
												onclick={() =>
													copyText(ownerInviteUrl(inv.token), 'Link do convite copiado.')}
											>
												<Copy class="size-3.5" />
												Link
											</Button>
										{/each}
									</div>
								{/if}
							</Table.Cell>
							<Table.Cell>
								<Badge variant={g.isActive ? 'secondary' : 'destructive'}>
									{g.isActive ? 'Ativo' : 'Inativo'}
								</Badge>
							</Table.Cell>
							<Table.Cell>{formatDate(g.createdAt)}</Table.Cell>
							<Table.Cell>
								<div class="flex items-center gap-sm">
									<Tooltip.Root>
										<Tooltip.Trigger>
											{#snippet child({ props })}
												<button
													{...props}
													type="button"
													class="grid size-8 cursor-pointer place-items-center"
													onclick={() => copyText(g.id, 'ID do grupo copiado.')}
													aria-label="Copiar ID"
												>
													<Copy class="size-4" />
												</button>
											{/snippet}
										</Tooltip.Trigger>
										<Tooltip.Content>Copiar ID</Tooltip.Content>
									</Tooltip.Root>
									<Button
										type="button"
										variant="outline"
										size="sm"
										disabled={togglingId === g.id}
										onclick={() => toggleActive(g.id, !g.isActive)}
									>
										{g.isActive ? 'Desativar' : 'Reativar'}
									</Button>
								</div>
							</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		</div>
	{/if}
</div>
