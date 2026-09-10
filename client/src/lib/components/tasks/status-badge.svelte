<script lang="ts">
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { TASK_STATUS_META, type TaskStatus } from '$lib/tasks/constants';

	let { status }: { status: TaskStatus } = $props();

	const meta = $derived(TASK_STATUS_META[status]);
</script>

<Badge class="badge-sticker {meta.badgeClass}">{meta.label}</Badge>
