<script lang="ts">
	import type { Snippet } from 'svelte';

	let { children }: { children?: Snippet } = $props();
</script>

<div class="table-wrap">
	<table>
		{@render children?.()}
	</table>
</div>
