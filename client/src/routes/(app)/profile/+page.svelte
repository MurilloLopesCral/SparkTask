<script lang="ts">
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import { Camera01Icon } from '@hugeicons/core-free-icons';
	import { getInitials } from '$lib/users/format';
	import { updateProfile, uploadAvatar } from '$lib/users/profile-api';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let form = $state(toFormState());
	let submitting = $state(false);
	let uploadingAvatar = $state(false);

	function toFormState() {
		return { name: data.user.name ?? '', email: data.user.email };
	}

	const initials = $derived(getInitials(data.user.name, data.user.email));

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		if (!form.name.trim() || !form.email.trim()) return;

		submitting = true;
		try {
			await updateProfile(form);
		} finally {
			submitting = false;
		}
	}

	async function handleAvatarSelect(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const selected = input.files?.[0];
		input.value = '';
		if (!selected) return;

		uploadingAvatar = true;
		try {
			await uploadAvatar(selected);
		} finally {
			uploadingAvatar = false;
		}
	}
</script>

<svelte:head><title>Meu perfil — SparkTask</title></svelte:head>

<div class="mx-auto flex max-w-[32rem] flex-col gap-lg p-md pb-[max(1rem,env(safe-area-inset-bottom))] md:p-lg lg:p-section">
	<h1 class="font-display text-h1 text-pretty uppercase">Meu perfil</h1>

	<div class="flex items-center gap-md sm:gap-lg">
		<div class="relative shrink-0">
			<Avatar.Root size="lg" class="size-20">
				<Avatar.Image src={data.user.image} alt={data.user.name ?? data.user.email} />
				<Avatar.Fallback class="text-h3">{initials}</Avatar.Fallback>
			</Avatar.Root>
			<label
				class="btn-secondary absolute -right-1 -bottom-1 grid size-11 place-items-center rounded-full p-0 sm:size-7 {uploadingAvatar
					? 'pointer-events-none opacity-40'
					: ''}"
			>
				<HugeiconsIcon icon={Camera01Icon} strokeWidth={2} class="size-3.5" />
				<span class="sr-only">Alterar foto</span>
				<input
					type="file"
					accept="image/*"
					class="hidden"
					onchange={handleAvatarSelect}
					disabled={uploadingAvatar}
				/>
			</label>
		</div>
		<div class="flex flex-col gap-xxs">
			<span class="font-sans text-h3 uppercase">{data.user.name || 'Sem nome'}</span>
			<span class="font-serif text-body-sm text-muted-foreground">{data.user.email}</span>
			{#if !data.user.emailVerified}
				<Badge variant="destructive" class="w-fit">E-mail não verificado</Badge>
			{/if}
		</div>
	</div>

	<form onsubmit={handleSubmit} class="flex flex-col gap-md border-t border-frame pt-lg">
		<label class="flex flex-col gap-xxs">
			<span class="font-sans text-ui-label uppercase">Nome</span>
			<input class="text-input" bind:value={form.name} required />
		</label>

		<label class="flex flex-col gap-xxs">
			<span class="font-sans text-ui-label uppercase">E-mail</span>
			<input type="email" class="text-input" bind:value={form.email} required />
			<span class="font-serif text-caption text-muted-foreground">
				Trocar o e-mail exige confirmação por um link enviado ao novo endereço.
			</span>
		</label>

		<Button type="submit" disabled={submitting} class="min-h-11 w-full sm:w-fit">
			{submitting ? 'Salvando…' : 'Salvar alterações'}
		</Button>
	</form>
</div>
