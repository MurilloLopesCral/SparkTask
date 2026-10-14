<script lang="ts">
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { TASK_KIND_META, type TaskKind } from '$lib/tasks/constants';

	let { kind }: { kind: TaskKind } = $props();

	const meta = $derived(TASK_KIND_META[kind]);
</script>

<Badge class="badge-sticker {meta.badgeClass}">{meta.label}</Badge>
