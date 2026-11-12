<script lang="ts">
	import { priorityChip } from '$lib/calendar/styles';
	import type { CalendarEvent } from '$lib/calendar/types';

	let {
		event,
		variant = 'compact',
		onSelect
	}: {
		event: CalendarEvent;
		variant?: 'compact' | 'row';
		onSelect?: (event: CalendarEvent) => void;
	} = $props();

	const style = $derived(priorityChip(event.priority));
	const isGhost = $derived(event.kind === 'ghost');
</script>

<button
	type="button"
	class={[
		'group flex w-full min-w-0 touch-manipulation items-center gap-1 text-left transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
		variant === 'compact' &&
			'rounded-none border px-1 py-0.5 font-serif text-[10px] leading-tight sm:text-caption',
		variant === 'row' && 'gap-sm border px-sm py-xs font-serif text-caption sm:text-body',
		isGhost
			? 'border-dashed border-frame/40 bg-muted/40 text-muted-foreground opacity-80 hover:opacity-100'
			: `${style.chip} hover:brightness-[0.97]`
	]}
	aria-label={`${event.title}${isGhost ? ' (prevista)' : ''}`}
	onclick={() => onSelect?.(event)}
>
	<span class={['size-1.5 shrink-0 rounded-full sm:size-2', style.bar]} aria-hidden="true"></span>
	<span class="min-w-0 truncate font-medium">{event.title}</span>
	{#if isGhost}
		<span class="shrink-0 font-sans text-[9px] uppercase tracking-wide opacity-70">prevista</span>
	{/if}
</button>
