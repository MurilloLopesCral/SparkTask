<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';

	type Tint = 'sage' | 'salmon' | 'peach' | 'lime' | 'sky' | 'steel' | 'periwinkle';

	let {
		label,
		value,
		hint,
		tint = 'sage'
	}: {
		label: string;
		value: string | number;
		hint?: string;
		tint?: Tint;
	} = $props();
</script>

<Card.Root
	class="gap-0 rounded-none border border-frame py-0 ring-0 [--card-spacing:0] transition-[transform,box-shadow] duration-150 motion-safe:hover:-translate-x-0.5 motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-[5px_5px_0_var(--frame)]"
	style="box-shadow: 3px 3px 0 var(--frame)"
>
	<Card.Header class="gap-0 rounded-none border-b border-frame bg-canvas px-md py-s">
		<Card.Title class="font-sans text-h3 text-ink uppercase">{label}</Card.Title>
	</Card.Header>
	<Card.Content class="ribbon-card-body ribbon-card-body--{tint} px-lg py-md">
		<p class="font-display text-display tabular-nums text-ink leading-none">{value}</p>
		{#if hint}
			<p class="mt-xs font-serif text-caption text-ink/70">{hint}</p>
		{/if}
	</Card.Content>
</Card.Root>
