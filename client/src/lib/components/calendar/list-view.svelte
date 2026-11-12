<script lang="ts">
	import EventChip from './event-chip.svelte';
	import { formatDayLong } from '$lib/calendar/dates';
	import type { CalendarEvent } from '$lib/calendar/types';

	let {
		events,
		onSelect
	}: {
		events: CalendarEvent[];
		onSelect: (event: CalendarEvent) => void;
	} = $props();

	const grouped = $derived.by(() => {
		const sorted = [...events].sort((a, b) =>
			a.date < b.date ? -1 : a.date > b.date ? 1 : a.title.localeCompare(b.title)
		);
		const map = new Map<string, CalendarEvent[]>();
		for (const event of sorted) {
			const list = map.get(event.date) ?? [];
			list.push(event);
			map.set(event.date, list);
		}
		return [...map.entries()];
	});
</script>

{#if grouped.length === 0}
	<div class="border border-frame bg-canvas px-md py-section text-center">
		<p class="font-serif text-body text-muted-foreground">Nenhuma tarefa com prazo neste período.</p>
	</div>
{:else}
	<div class="flex flex-col gap-md border border-frame bg-canvas p-md">
		{#each grouped as [date, dayEvents] (date)}
			<section class="flex flex-col gap-sm" aria-labelledby={`cal-day-${date}`}>
				<h3
					id={`cal-day-${date}`}
					class="font-sans text-ui-label text-muted-foreground uppercase"
				>
					{formatDayLong(date)}
				</h3>
				<ul class="flex flex-col gap-xs">
					{#each dayEvents as event (event.id)}
						<li>
							<EventChip {event} variant="row" onSelect={() => onSelect(event)} />
							{#if event.projectName}
								<p class="mt-0.5 truncate px-sm font-serif text-caption text-muted-foreground">
									{event.projectName}
									{#if event.ownerName}
										· {event.ownerName}
									{/if}
								</p>
							{/if}
						</li>
					{/each}
				</ul>
			</section>
		{/each}
	</div>
{/if}
