<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import * as Table from '$lib/components/ui/table/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import { Delete02Icon, Copy01Icon } from '@hugeicons/core-free-icons';
	import InviteUserSheet from '$lib/components/users/invite-user-sheet.svelte';
	import { revokeInvite, removeMember } from '$lib/users/api';
	import { formatDate } from '$lib/tasks/format';
	import { getInitials } from '$lib/users/format';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let copiedInviteId = $state<string | null>(null);

	const roleLabels: Record<string, string> = {
		owner: 'Owner',
		moderator: 'Moderador',
		member: 'Membro'
	};

	function setGroup(next: string) {
		goto(resolve(`/users?group=${next}`), { replaceState: true, keepFocus: true, noScroll: true });
	}

	async function copyInviteLink(inviteId: string, token: string) {
		const url = `${page.url.origin}/signup/${token}`;
		await navigator.clipboard.writeText(url);
		copiedInviteId = inviteId;
		setTimeout(() => (copiedInviteId = null), 2000);
	}
</script>

<svelte:head><title>Grupos — SparkTask</title></svelte:head>

<div class="p-md pb-[max(1rem,env(safe-area-inset-bottom))] md:p-lg lg:p-section">
	<div
		class="mb-lg flex flex-col gap-md sm:flex-row sm:flex-wrap sm:items-center sm:justify-between"
	>
		<h1 class="font-display text-h1 text-pretty uppercase">Grupos</h1>

		<div class="flex w-full flex-wrap items-center gap-sm sm:w-auto sm:gap-md">
			{#if data.ownedGroups.length > 1}
				<Select.Root type="single" value={data.selectedGroupId} onValueChange={setGroup}>
					<Select.Trigger class="min-h-11 w-full sm:w-48">
						{data.ownedGroups.find((g) => g.id === data.selectedGroupId)?.name}
					</Select.Trigger>
					<Select.Content>
						{#each data.ownedGroups as g (g.id)}
							<Select.Item value={g.id} label={g.name} />
						{/each}
					</Select.Content>
				</Select.Root>
			{/if}

			<InviteUserSheet groupId={data.selectedGroupId} />
		</div>
	</div>

	<h2 class="mb-sm font-sans text-h3 uppercase">Membros</h2>

	<ul class="mb-xl flex flex-col gap-sm md:hidden">
		{#each data.members as member (member.id)}
			<li class="flex flex-col gap-sm border border-frame bg-canvas p-md">
				<div class="flex items-center gap-sm">
					<Avatar.Root size="sm" class="size-10 shrink-0">
						<Avatar.Image src={member.image} alt={member.name ?? member.email} />
						<Avatar.Fallback class="text-caption">
							{getInitials(member.name, member.email)}
						</Avatar.Fallback>
					</Avatar.Root>
					<div class="min-w-0 flex-1">
						<p class="truncate font-sans font-medium">{member.name || '—'}</p>
						<p class="truncate font-serif text-caption text-muted-foreground">{member.email}</p>
					</div>
					{#if member.id !== data.user.id}
						<button
							type="button"
							class="grid size-11 shrink-0 place-items-center"
							onclick={() => removeMember(data.selectedGroupId, member.id)}
						>
							<HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
							<span class="sr-only">Remover do grupo</span>
						</button>
					{/if}
				</div>
				<div class="flex flex-wrap gap-sm font-serif text-caption text-muted-foreground">
					<span>{roleLabels[member.role]}</span>
					<span aria-hidden="true">·</span>
					<span>Desde {formatDate(member.joinedAt)}</span>
				</div>
			</li>
		{/each}
	</ul>

	<div class="mb-xl hidden md:block">
		<Table.Root class="data-table">
			<Table.Header>
				<Table.Row>
					<Table.Head>Nome</Table.Head>
					<Table.Head>E-mail</Table.Head>
					<Table.Head>Papel</Table.Head>
					<Table.Head>Desde</Table.Head>
					<Table.Head></Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#each data.members as member (member.id)}
					<Table.Row>
						<Table.Cell class="font-sans font-medium">
							<span class="flex items-center gap-xs">
								<Avatar.Root size="sm" class="size-7">
									<Avatar.Image src={member.image} alt={member.name ?? member.email} />
									<Avatar.Fallback class="text-[11px]">
										{getInitials(member.name, member.email)}
									</Avatar.Fallback>
								</Avatar.Root>
								{member.name || '—'}
							</span>
						</Table.Cell>
						<Table.Cell>{member.email}</Table.Cell>
						<Table.Cell>{roleLabels[member.role]}</Table.Cell>
						<Table.Cell>{formatDate(member.joinedAt)}</Table.Cell>
						<Table.Cell>
							{#if member.id !== data.user.id}
								<button
									type="button"
									class="grid size-6 cursor-pointer place-items-center"
									onclick={() => removeMember(data.selectedGroupId, member.id)}
								>
									<HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
									<span class="sr-only">Remover do grupo</span>
								</button>
							{/if}
						</Table.Cell>
					</Table.Row>
				{/each}
			</Table.Body>
		</Table.Root>
	</div>

	<h2 class="mb-sm font-sans text-h3 uppercase">Convites pendentes</h2>
	{#if data.invites.length === 0}
		<p class="font-serif text-body-sm text-muted-foreground">Nenhum convite pendente.</p>
	{:else}
		<ul class="flex flex-col gap-sm md:hidden">
			{#each data.invites as invite (invite.id)}
				{@const expired = invite.expiresAt.getTime() < Date.now()}
				<li class="flex flex-col gap-sm border border-frame bg-canvas p-md">
					<div class="min-w-0">
						<p class="truncate font-sans font-medium">{invite.email}</p>
						<p class="font-serif text-caption text-muted-foreground">
							{roleLabels[invite.role]} · Expira {formatDate(invite.expiresAt)}
							{#if expired}
								<Badge variant="destructive" class="ml-xs">Expirado</Badge>
							{/if}
						</p>
					</div>
					<div class="flex items-center gap-sm">
						<button
							type="button"
							class="grid size-11 place-items-center"
							onclick={() => copyInviteLink(invite.id, invite.token)}
						>
							<HugeiconsIcon icon={Copy01Icon} strokeWidth={2} />
							<span class="sr-only">Copiar link do convite</span>
						</button>
						{#if copiedInviteId === invite.id}
							<span class="font-serif text-caption text-muted-foreground">Copiado!</span>
						{/if}
						<button
							type="button"
							class="grid size-11 place-items-center"
							onclick={() => revokeInvite(data.selectedGroupId, invite.id)}
						>
							<HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
							<span class="sr-only">Cancelar convite</span>
						</button>
					</div>
				</li>
			{/each}
		</ul>

		<div class="hidden md:block">
			<Table.Root class="data-table">
				<Table.Header>
					<Table.Row>
						<Table.Head>E-mail</Table.Head>
						<Table.Head>Papel</Table.Head>
						<Table.Head>Expira em</Table.Head>
						<Table.Head></Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each data.invites as invite (invite.id)}
						{@const expired = invite.expiresAt.getTime() < Date.now()}
						<Table.Row>
							<Table.Cell>{invite.email}</Table.Cell>
							<Table.Cell>{roleLabels[invite.role]}</Table.Cell>
							<Table.Cell>
								{formatDate(invite.expiresAt)}
								{#if expired}
									<Badge variant="destructive" class="ml-xs">Expirado</Badge>
								{/if}
							</Table.Cell>
							<Table.Cell>
								<div class="flex items-center gap-sm">
									<Tooltip.Root>
										<Tooltip.Trigger>
											{#snippet child({ props })}
												<button
													{...props}
													type="button"
													class="grid size-6 cursor-pointer place-items-center"
													onclick={() => copyInviteLink(invite.id, invite.token)}
												>
													<HugeiconsIcon icon={Copy01Icon} strokeWidth={2} />
													<span class="sr-only">Copiar link do convite</span>
												</button>
											{/snippet}
										</Tooltip.Trigger>
										<Tooltip.Content>Copiar link do convite</Tooltip.Content>
									</Tooltip.Root>
									{#if copiedInviteId === invite.id}
										<span class="font-serif text-caption text-muted-foreground">Copiado!</span>
									{/if}
									<Tooltip.Root>
										<Tooltip.Trigger>
											{#snippet child({ props })}
												<button
													{...props}
													type="button"
													class="grid size-6 cursor-pointer place-items-center"
													onclick={() => revokeInvite(data.selectedGroupId, invite.id)}
												>
													<HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
													<span class="sr-only">Cancelar convite</span>
												</button>
											{/snippet}
										</Tooltip.Trigger>
										<Tooltip.Content>Cancelar convite</Tooltip.Content>
									</Tooltip.Root>
								</div>
							</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		</div>
	{/if}
</div>
