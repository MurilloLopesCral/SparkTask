<script lang="ts">
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head><title>Início — SparkTask</title></svelte:head>

<div class="p-lg lg:p-section">
	<h1 class="font-display text-h1 uppercase">Olá, {data.user.name || data.user.email}.</h1>
	<p class="mt-xs font-serif text-body text-muted-foreground">
		A home ainda está em construção — próximo passo.
	</p>
</div>
