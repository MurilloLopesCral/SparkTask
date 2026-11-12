<script lang="ts">
	import { CalendarPlus, ListPlus } from '@lucide/svelte';
	import * as ContextMenu from '$lib/components/ui/context-menu/index.js';
	import EventChip from './event-chip.svelte';
	import {
		WEEKDAY_LABELS_SHORT,
		formatDayShort,
		isSameDay,
		toYmd,
		weekDays
	} from '$lib/calendar/dates';
	import type { CalendarEvent } from '$lib/calendar/types';

	let {
		anchor,
		events,
		onSelect,
		onCreateTask,
		onCreateRecurrence
	}: {
		anchor: Date;
		events: CalendarEvent[];
		onSelect: (event: CalendarEvent) => void;
		onCreateTask?: (date: string) => void;
		onCreateRecurrence?: (date: string) => void;
	} = $props();

	const days = $derived(weekDays(anchor));
	const today = new Date();

	const byDate = $derived.by(() => {
		const map = new Map<string, CalendarEvent[]>();
		for (const event of events) {
			const list = map.get(event.date) ?? [];
			list.push(event);
			map.set(event.date, list);
		}
		return map;
	});
</script>

<div class="overflow-x-auto border border-frame bg-canvas overscroll-x-contain">
	<div class="grid min-w-[40rem] grid-cols-7">
		{#each days as day, i (toYmd(day))}
			{@const key = toYmd(day)}
			{@const dayEvents = byDate.get(key) ?? []}
			{@const isToday = isSameDay(day, today)}
			<ContextMenu.Root>
				<ContextMenu.Trigger
					class="flex min-h-64 flex-col border-r border-frame text-left last:border-r-0 transition-colors duration-150 hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
					aria-label={`${WEEKDAY_LABELS_SHORT[i]}, ${formatDayShort(day)}`}
				>
					<header
						class={[
							'border-b border-frame px-xs py-sm text-center',
							isToday && 'bg-frame text-canvas'
						]}
					>
						<div class="font-sans text-ui-label uppercase">{WEEKDAY_LABELS_SHORT[i]}</div>
						<div class="font-serif text-caption tabular-nums">{formatDayShort(day)}</div>
					</header>
					<div class="flex flex-1 flex-col gap-1 p-xs">
						{#if dayEvents.length === 0}
							<p class="font-serif text-caption text-muted-foreground">Sem itens</p>
						{:else}
							{#each dayEvents as event (event.id)}
								<EventChip {event} variant="row" onSelect={() => onSelect(event)} />
							{/each}
						{/if}
					</div>
				</ContextMenu.Trigger>
				<ContextMenu.Content class="min-w-48 rounded-none border-frame">
					<ContextMenu.Label class="font-sans text-ui-label uppercase">
						{WEEKDAY_LABELS_SHORT[i]} · {formatDayShort(day)}
					</ContextMenu.Label>
					<ContextMenu.Separator />
					<ContextMenu.Item class="rounded-none" onclick={() => onCreateTask?.(key)}>
						<ListPlus class="size-4" aria-hidden="true" />
						Criar tarefa
					</ContextMenu.Item>
					<ContextMenu.Item class="rounded-none" onclick={() => onCreateRecurrence?.(key)}>
						<CalendarPlus class="size-4" aria-hidden="true" />
						Criar recorrência
					</ContextMenu.Item>
				</ContextMenu.Content>
			</ContextMenu.Root>
		{/each}
	</div>
</div>
