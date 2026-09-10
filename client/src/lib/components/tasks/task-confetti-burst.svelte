<script lang="ts">
	import { Confetti } from 'svelte-confetti';
	import { celebration } from '$lib/tasks/celebration.svelte';

	let { taskId }: { taskId: string } = $props();

	const burstId = $derived(
		celebration.current?.taskId === taskId ? celebration.current.burstId : null
	);
</script>

{#if burstId !== null}
	{#key burstId}
		<div class="pointer-events-none absolute inset-0 z-50 flex items-center justify-center">
			<Confetti amount={80} x={[-1, 1]} y={[-1, 1]} duration={2200} />
		</div>
	{/key}
{/if}
