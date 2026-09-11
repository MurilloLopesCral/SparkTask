<script lang="ts">
	import TaskCard from './task-card.svelte';
	import type { FileUploadConfig } from '$lib/tasks/files-api';
	import type { VisibleTask } from '$lib/server/tasks';

	let {
		tasks,
		groupMembers,
		fileUploadConfig
	}: {
		tasks: VisibleTask[];
		groupMembers: { groupId: string; id: string; name: string | null; email: string }[];
		fileUploadConfig: FileUploadConfig;
	} = $props();
</script>

<ul class="flex flex-col gap-md">
	{#each tasks as task (task.id)}
		<li>
			<TaskCard {task} {groupMembers} {fileUploadConfig} />
		</li>
	{/each}
</ul>
