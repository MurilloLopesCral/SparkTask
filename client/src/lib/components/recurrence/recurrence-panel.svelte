<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Plus } from '@lucide/svelte';
	import RecurrenceSheet from './recurrence-sheet.svelte';
	import RecurrenceCard from './recurrence-card.svelte';
	import { setRecurrenceEnabled } from '$lib/recurrence/api';
	import type { RecurrenceRow } from '$lib/recurrence/types';

	type Project = { id: string; name: string; groupId: string };
	type Member = { groupId: string; id: string; name: string | null; email: string };

	let {
		recurrences,
		projects,
		groupMembers,
		initialStartFrom = '',
		openCreate = $bindable(false)
	}: {
		recurrences: RecurrenceRow[];
		projects: Project[];
		groupMembers: Member[];
		initialStartFrom?: string;
		openCreate?: boolean;
	} = $props();

	let sheetOpen = $state(false);
	let editing = $state<RecurrenceRow | null>(null);
	let startFrom = $state('');
	let togglingId = $state<string | null>(null);

	$effect(() => {
		if (openCreate) {
			editing = null;
			startFrom = initialStartFrom;
			sheetOpen = true;
			openCreate = false;
		}
	});

	function openNew() {
		editing = null;
		startFrom = initialStartFrom;
		sheetOpen = true;
	}

	function openEdit(row: RecurrenceRow) {
		editing = row;
		startFrom = '';
		sheetOpen = true;
	}

	async function toggleEnabled(row: RecurrenceRow) {
		if (togglingId) return;
		togglingId = row.id;
		try {
			await setRecurrenceEnabled(row.id, !row.enabled);
		} finally {
			togglingId = null;
		}
	}
</script>

<div class="flex flex-col gap-md">
	<div class="flex flex-wrap items-end justify-between gap-sm">
		<p class="max-w-prose font-serif text-caption text-muted-foreground">
			Modelos que geram tarefas futuras. Editar não altera ocorrências já criadas.
		</p>
		<Button type="button" onclick={openNew} class="min-h-11 touch-manipulation">
			<Plus class="size-4" aria-hidden="true" />
			Nova recorrência
		</Button>
	</div>

	{#if recurrences.length === 0}
		<div class="border border-frame bg-canvas px-md py-section text-center">
			<p class="font-serif text-body text-muted-foreground">Nenhuma recorrência neste grupo.</p>
		</div>
	{:else}
		<ul class="grid grid-cols-1 gap-md sm:grid-cols-2 xl:grid-cols-3">
			{#each recurrences as row (row.id)}
				<li>
					<RecurrenceCard
						{row}
						toggling={togglingId === row.id}
						onEdit={openEdit}
						onToggle={toggleEnabled}
					/>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<RecurrenceSheet
	{projects}
	{groupMembers}
	initialStartFrom={startFrom}
	bind:open={sheetOpen}
	bind:editing
/>
