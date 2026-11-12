<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import RecurrencePanel from '$lib/components/recurrence/recurrence-panel.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	function setGroup(groupId: string) {
		const params = new URLSearchParams(page.url.searchParams);
		params.set('group', groupId);
		void goto(`${resolve('/recurrences')}?${params.toString()}`, {
			replaceState: true,
			keepFocus: true,
			noScroll: true
		});
	}
</script>

<svelte:head><title>Recorrências — SparkTask</title></svelte:head>

<div
	class="flex flex-col gap-section p-md pb-[max(1rem,env(safe-area-inset-bottom))] md:p-lg lg:p-section"
>
	<header class="flex flex-col gap-md">
		<div>
			<p class="section-eyebrow section-eyebrow--salmon">Automação</p>
			<h1 class="font-display text-h1 uppercase text-pretty">Recorrências</h1>
			<p class="mt-xs max-w-prose font-serif text-body text-muted-foreground">
				Modelos que criam tarefas automaticamente — diárias, semanais ou mensais.
			</p>
		</div>

		{#if data.groups.length > 0 && data.selectedGroupId}
			<label class="flex w-full min-w-[12rem] max-w-sm flex-col gap-xxs">
				<span class="font-sans text-ui-label uppercase">Grupo</span>
				<select
					class="text-input min-h-11"
					name="group"
					value={data.selectedGroupId}
					onchange={(e) => setGroup(e.currentTarget.value)}
				>
					{#each data.groups as group (group.id)}
						<option value={group.id}>{group.name}</option>
					{/each}
				</select>
			</label>
		{/if}
	</header>

	{#if !data.selectedGroupId}
		<div class="border border-frame bg-canvas px-md py-section text-center">
			<p class="font-serif text-body text-muted-foreground">
				Você precisa participar de um grupo para gerenciar recorrências.
			</p>
		</div>
	{:else}
		<RecurrencePanel
			recurrences={data.recurrences}
			projects={data.projects}
			groupMembers={data.groupMembers}
		/>
	{/if}
</div>
