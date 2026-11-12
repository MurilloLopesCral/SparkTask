<script lang="ts">
	import { CalendarPlus, ListPlus } from '@lucide/svelte';
	import * as ContextMenu from '$lib/components/ui/context-menu/index.js';
	import EventChip from './event-chip.svelte';
	import {
		WEEKDAY_LABELS_NARROW,
		WEEKDAY_LABELS_SHORT,
		isSameDay,
		isSameMonth,
		monthGridDays,
		toYmd
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

	const days = $derived(monthGridDays(anchor));
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

<div class="overflow-hidden border border-frame bg-canvas">
	<div class="grid grid-cols-7 border-b border-frame">
		{#each WEEKDAY_LABELS_SHORT as label, i (label + i)}
			<div
				class="border-r border-frame p-xs text-center font-sans text-ui-label uppercase last:border-r-0"
			>
				<span class="hidden sm:inline">{label}</span>
				<span class="sm:hidden">{WEEKDAY_LABELS_NARROW[i]}</span>
			</div>
		{/each}
	</div>

	<div class="grid grid-cols-7">
		{#each days as day (toYmd(day))}
			{@const key = toYmd(day)}
			{@const dayEvents = byDate.get(key) ?? []}
			{@const inMonth = isSameMonth(day, anchor)}
			{@const isToday = isSameDay(day, today)}
			<ContextMenu.Root>
				<ContextMenu.Trigger
					class={[
						'flex min-h-20 flex-col gap-1 border-b border-r border-frame p-1 text-left last:border-r-0 sm:min-h-28 sm:p-xs',
						!inMonth && 'bg-muted/40 text-muted-foreground',
						'transition-colors duration-150 hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring'
					]}
				>
					<div
						class={[
							'mb-0.5 flex size-6 items-center justify-center font-sans text-caption tabular-nums sm:size-7 sm:text-body',
							isToday && 'bg-frame font-semibold text-canvas'
						]}
						aria-current={isToday ? 'date' : undefined}
					>
						{day.getDate()}
					</div>
					<div class="flex min-w-0 flex-1 flex-col gap-0.5">
						{#each dayEvents.slice(0, 3) as event (event.id)}
							<EventChip {event} onSelect={() => onSelect(event)} />
						{/each}
						{#if dayEvents.length > 3}
							<span class="font-serif text-[10px] text-muted-foreground sm:text-caption">
								+{dayEvents.length - 3} mais
							</span>
						{/if}
					</div>
				</ContextMenu.Trigger>
				<ContextMenu.Content class="min-w-48 rounded-none border-frame">
					<ContextMenu.Label class="font-sans text-ui-label uppercase">
						{day.getDate()}/{day.getMonth() + 1}
					</ContextMenu.Label>
					<ContextMenu.Separator />
					<ContextMenu.Item
						class="rounded-none"
						onclick={() => onCreateTask?.(key)}
					>
						<ListPlus class="size-4" aria-hidden="true" />
						Criar tarefa
					</ContextMenu.Item>
					<ContextMenu.Item
						class="rounded-none"
						onclick={() => onCreateRecurrence?.(key)}
					>
						<CalendarPlus class="size-4" aria-hidden="true" />
						Criar recorrência
					</ContextMenu.Item>
				</ContextMenu.Content>
			</ContextMenu.Root>
		{/each}
	</div>
</div>
