<script lang="ts">
	import TaskCard from './task-card.svelte';
	import type { FileUploadConfig } from '$lib/tasks/files-api';
	import type { TaskProjectOption } from '$lib/tasks/project-option';
	import type { VisibleTask } from '$lib/server/tasks';

	let {
		tasks,
		projects,
		groupMembers,
		fileUploadConfig
	}: {
		tasks: VisibleTask[];
		projects: TaskProjectOption[];
		groupMembers: { groupId: string; id: string; name: string | null; email: string }[];
		fileUploadConfig: FileUploadConfig;
	} = $props();
</script>

<ul class="flex flex-col gap-md">
	{#each tasks as task (task.id)}
		<li>
			<TaskCard {task} {projects} {groupMembers} {fileUploadConfig} />
		</li>
	{/each}
</ul>
