<script lang="ts">
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import { ArrowDown01Icon } from '@hugeicons/core-free-icons';
	import { getInitials } from '$lib/users/format';
	import { setTaskOwner } from '$lib/tasks/api';

	type Member = {
		id: string;
		name: string | null;
		email: string;
		image?: string | null;
	};

	let {
		taskId,
		ownerId,
		owner,
		members,
		compact = false
	}: {
		taskId: string;
		ownerId: string | null;
		owner: { name: string | null; email: string; image?: string | null } | null;
		members: Member[];
		/** Tighter trigger for kanban cards. */
		compact?: boolean;
	} = $props();

	let open = $state(false);
	let saving = $state(false);
	let value = $state(ownerId ?? '');

	$effect(() => {
		value = ownerId ?? '';
	});

	const ownerName = $derived(owner?.name || owner?.email || 'Sem responsável');
	const ownerInitials = $derived(owner ? getInitials(owner.name, owner.email) : '—');

	async function handleChange(next: string) {
		const nextId = next || null;
		if (nextId === (ownerId ?? null)) return;

		saving = true;
		value = next;
		try {
			const ok = await setTaskOwner(taskId, nextId);
			if (!ok) value = ownerId ?? '';
		} finally {
			saving = false;
		}
	}
</script>

<!-- stopPropagation: card/row click opens details — keep the select interactive. -->
<div
	role="presentation"
	onclick={(e) => e.stopPropagation()}
	onkeydown={(e) => e.stopPropagation()}
	class="min-w-0"
>
	<Select.Root
		type="single"
		bind:open
		bind:value
		disabled={saving}
		onValueChange={handleChange}
	>
		<Select.Trigger
			size="sm"
			aria-label="Trocar responsável"
			class="badge-sticker h-auto max-w-full min-h-8 gap-xxs rounded-none border-frame bg-canvas px-xs py-xxs font-serif text-caption text-ink shadow-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-frame [&>svg:last-child]:hidden {compact
				? 'max-w-[11rem]'
				: 'max-w-[16rem]'} {saving ? 'opacity-60' : ''}"
		>
			<span class="flex min-w-0 items-center gap-xxs">
				<Avatar.Root size="sm" class={compact ? 'size-5' : 'size-6'}>
					<Avatar.Image src={owner?.image} alt={ownerName} />
					<Avatar.Fallback class="text-[10px]">{ownerInitials}</Avatar.Fallback>
				</Avatar.Root>
				<span class="min-w-0 truncate font-bold">{ownerName}</span>
				<HugeiconsIcon
					icon={ArrowDown01Icon}
					strokeWidth={2}
					class="size-3.5 shrink-0 text-muted-foreground"
					aria-hidden="true"
				/>
			</span>
		</Select.Trigger>
		<Select.Content class="max-h-64 min-w-48">
			<Select.Item value="" label="Sem responsável" />
			{#each members as m (m.id)}
				<Select.Item value={m.id} label={m.name || m.email} />
			{/each}
		</Select.Content>
	</Select.Root>
</div>
