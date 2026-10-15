<script lang="ts">
	let {
		src,
		alt,
		size = 'sm',
		loading = 'lazy'
	}: {
		src: string | null | undefined;
		alt: string;
		size?: 'sm' | 'md' | 'lg';
		loading?: 'eager' | 'lazy';
	} = $props();

	const sizeClass = $derived(
		size === 'lg' ? 'project-icon project-icon-lg' : size === 'md' ? 'project-icon project-icon-md' : 'project-icon'
	);
	const pixels = $derived(size === 'lg' ? 64 : size === 'md' ? 40 : 20);
</script>

{#if src}
	<img
		{src}
		{alt}
		width={pixels}
		height={pixels}
		{loading}
		class={sizeClass}
		decoding="async"
		aria-hidden={alt === '' ? 'true' : undefined}
	/>
{/if}
