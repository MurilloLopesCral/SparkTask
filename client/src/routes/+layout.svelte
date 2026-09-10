<script lang="ts">
	import './layout.css';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import { Toaster } from 'svelte-sonner';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href="/sparktask.ico" type="image/x-icon" />
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
