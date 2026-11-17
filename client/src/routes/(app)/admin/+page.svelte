<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import AdminGroupsSection from '$lib/components/admin/admin-groups-section.svelte';
	import AdminUsersSection from '$lib/components/admin/admin-users-section.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const tab = $derived(data.tab);

	function setTab(next: string) {
		const params = new URLSearchParams(page.url.searchParams);
		if (next === 'users') params.set('tab', 'users');
		else params.delete('tab');
		const qs = params.toString();
		void goto(resolve(qs ? `/admin?${qs}` : '/admin'), {
			replaceState: true,
			keepFocus: true,
			noScroll: true
		});
	}
</script>

<svelte:head><title>Admin — SparkTask</title></svelte:head>

<div class="p-md pb-[max(1rem,env(safe-area-inset-bottom))] md:p-lg lg:p-section">
	<header class="mb-lg flex flex-col gap-xxs">
		<p class="section-eyebrow section-eyebrow--olive">Governança</p>
		<h1 class="font-display text-h1 text-pretty uppercase">Admin</h1>
		<p class="max-w-prose font-serif text-body-sm text-muted-foreground">
			Gerencie usuários (ativação e vínculo Plexus) e grupos da plataforma.
		</p>
	</header>

	<Tabs.Root value={tab} onValueChange={setTab} class="gap-md">
		<Tabs.List>
			<Tabs.Trigger value="groups">Grupos</Tabs.Trigger>
			<Tabs.Trigger value="users">Usuários</Tabs.Trigger>
		</Tabs.List>

		{#if tab === 'users'}
			<AdminUsersSection directory={data.directory} plexusReady={data.plexusReady} />
		{:else}
			<AdminGroupsSection groups={data.groups} users={data.users} />
		{/if}
	</Tabs.Root>
</div>
