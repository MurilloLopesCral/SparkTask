<script lang="ts">
	import { CalendarDays, CalendarRange, Calendar, Pause, Play, Pencil } from '@lucide/svelte';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { formatDueOffset, formatRecurrenceTitleCase } from '$lib/recurrence/constants';
	import type { RecurrenceRow } from '$lib/recurrence/types';

	let {
		row,
		toggling = false,
		onEdit,
		onToggle
	}: {
		row: RecurrenceRow;
		toggling?: boolean;
		onEdit: (row: RecurrenceRow) => void;
		onToggle: (row: RecurrenceRow) => void;
	} = $props();

	const summary = $derived(formatRecurrenceTitleCase(row));
	const dueSummary = $derived(formatDueOffset(row));
	const Icon = $derived(
		row.frequency === 'daily' ? CalendarDays : row.frequency === 'weekly' ? CalendarRange : Calendar
	);
</script>

<Card.Root
	size="sm"
	class="rounded-none ring-frame transition-colors duration-150 hover:bg-muted/40"
>
	<Card.Header class="gap-sm">
		<div class="flex items-start justify-between gap-sm">
			<div
				class="grid size-10 shrink-0 place-items-center border border-frame bg-muted text-ink"
				aria-hidden="true"
			>
				<Icon class="size-5" strokeWidth={1.75} />
			</div>
			{#if !row.enabled}
				<Badge variant="outline" class="rounded-none">Pausada</Badge>
			{/if}
		</div>
		<Card.Title class="min-w-0 truncate font-sans text-h3 uppercase tracking-wide">
			{row.title}
		</Card.Title>
		<Card.Description class="font-serif text-body text-ink">
			{summary}
		</Card.Description>
		<p class="font-serif text-caption text-ink/80">{dueSummary}</p>
		<p class="truncate font-serif text-caption text-muted-foreground">
			{row.project?.name ?? 'Projeto'}
			· próxima {row.nextDueDate}
		</p>
	</Card.Header>
	<Card.Footer class="gap-xs border-t border-frame pt-(--card-spacing)">
		<Button
			type="button"
			variant="secondary"
			size="sm"
			class="min-h-10 flex-1 touch-manipulation rounded-none"
			onclick={() => onEdit(row)}
		>
			<Pencil class="size-3.5" aria-hidden="true" />
			Editar
		</Button>
		<Button
			type="button"
			variant="secondary"
			size="sm"
			class="min-h-10 flex-1 touch-manipulation rounded-none"
			disabled={toggling}
			onclick={() => onToggle(row)}
			aria-label={row.enabled ? 'Pausar recorrência' : 'Retomar recorrência'}
		>
			{#if row.enabled}
				<Pause class="size-3.5" aria-hidden="true" />
				{toggling ? '…' : 'Pausar'}
			{:else}
				<Play class="size-3.5" aria-hidden="true" />
				{toggling ? '…' : 'Retomar'}
			{/if}
		</Button>
	</Card.Footer>
</Card.Root>
