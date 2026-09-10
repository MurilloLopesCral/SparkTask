<script lang="ts">
	import Navbar from '$lib/components/navbar.svelte';
	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();

	const isGroupOwner = $derived(data.groups.some((g) => g.role === 'owner'));
</script>

<Navbar user={data.user} {isGroupOwner} />
<main>
	{@render children()}
</main>
