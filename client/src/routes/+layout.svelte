<script lang="ts">
	import { onMount } from 'svelte';
	import './layout.css';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import { Toaster } from 'svelte-sonner';
	import { pwaInfo } from 'virtual:pwa-info';

	let { children } = $props();

	const webManifest = $derived(pwaInfo ? pwaInfo.webManifest.linkTag : '');

	onMount(async () => {
		if (!pwaInfo) return;
		const { registerSW } = await import('virtual:pwa-register');
		registerSW({ immediate: true });
	});
</script>

<svelte:head>
	<link rel="icon" href="/assets/sparktask.ico" type="image/x-icon" />
	<link rel="apple-touch-icon" href="/assets/sparktask_180.png" />
	{#if webManifest}
		{@html webManifest}
	{/if}
</svelte:head>

<Tooltip.Provider>
	{@render children()}
</Tooltip.Provider>
<Toaster
	position="bottom-right"
	toastOptions={{
		unstyled: true,
		classes: {
			toast:
				'flex items-start gap-sm border border-frame bg-canvas p-md w-full shadow-[3px_3px_0_var(--frame)]',
			title: 'font-sans text-ui-label uppercase text-ink',
			description: 'font-serif text-body-sm text-muted-foreground',
			error: 'border-l-4 border-l-dell-red',
			success: 'border-l-4 border-l-tint-sage'
		}
	}}
/>
