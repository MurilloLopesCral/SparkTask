<script lang="ts">
	import { SvelteMap } from 'svelte/reactivity';
	import * as ScrollArea from '$lib/components/ui/scroll-area/index.js';
	import TaskCard from './task-card.svelte';
	import { TASK_STATUSES, type TaskStatus } from '$lib/tasks/constants';
	import { setTaskStatus } from '$lib/tasks/api';
	import type { FileUploadConfig } from '$lib/tasks/files-api';
	import type { VisibleTask } from '$lib/server/tasks';

	let {
		tasks,
		projects,
		groupMembers,
		fileUploadConfig
	}: {
		tasks: VisibleTask[];
		projects: { id: string; name: string; groupId: string }[];
		groupMembers: { groupId: string; id: string; name: string | null; email: string }[];
		fileUploadConfig: FileUploadConfig;
	} = $props();

	let draggedTaskId = $state<string | null>(null);
	let dragOverStatus = $state<TaskStatus | null>(null);
	/** Pending column moves — applied instantly so the card doesn't snap back while PATCH runs. */
	const statusOverrides = new SvelteMap<string, TaskStatus>();

	// Drop overrides once the server (via invalidate) catches up to the optimistic status.
	$effect(() => {
		for (const task of tasks) {
			const override = statusOverrides.get(task.id);
			if (override && task.status === override) statusOverrides.delete(task.id);
		}
	});

	const displayTasks = $derived.by(() =>
		tasks.map((task) => {
			const override = statusOverrides.get(task.id);
			return override && override !== task.status ? { ...task, status: override } : task;
		})
	);

	// Newest first within each column — the load already orders by createdAt desc,
	// so grouping preserves that order without a second sort.
	const tasksByStatus = $derived.by(() => {
		const map = new SvelteMap<TaskStatus, VisibleTask[]>();
		for (const status of TASK_STATUSES) map.set(status.value, []);
		for (const task of displayTasks) map.get(task.status)?.push(task);
		return map;
	});

	async function handleDrop(status: TaskStatus) {
		const taskId = draggedTaskId;
		dragOverStatus = null;
		draggedTaskId = null;
		if (!taskId) return;

		const dragged = displayTasks.find((t) => t.id === taskId);
		if (!dragged || dragged.status === status) return;

		statusOverrides.set(taskId, status);

		const ok = await setTaskStatus(taskId, status);
		if (!ok) statusOverrides.delete(taskId);
	}
</script>

<div class="flex h-full gap-lg overflow-x-auto pb-lg">
	{#each TASK_STATUSES as column (column.value)}
		{@const columnTasks = tasksByStatus.get(column.value) ?? []}
		<div
			class="kanban-column flex h-full w-72 shrink-0 flex-col gap-sm"
			role="group"
			aria-label={column.label}
			ondragover={(e) => {
				e.preventDefault();
				dragOverStatus = column.value;
			}}
			ondragleave={(e) => {
				// dragleave fires when the pointer crosses onto a child element
				// (a card, the drop zone) too, not just when it leaves the column —
				// ignore those or the drop zone flickers on/off while dragging over cards.
				const target = e.currentTarget;
				const related = e.relatedTarget;
				if (related instanceof Node && target.contains(related)) return;
				if (dragOverStatus === column.value) dragOverStatus = null;
			}}
			ondrop={(e) => {
				e.preventDefault();
				handleDrop(column.value);
			}}
		>
			<div class="flex shrink-0 items-center justify-between border-b border-frame pb-xs">
				<span class="font-sans text-ui-label uppercase">{column.label}</span>
				<span class="font-serif text-caption text-muted-foreground">{columnTasks.length}</span>
			</div>

			{#if dragOverStatus === column.value}
				<div class="kanban-drop-zone shrink-0">Soltar aqui</div>
			{/if}

			<ScrollArea.Root class="min-h-0 flex-1">
				<div class="flex flex-col gap-sm pr-sm pb-xs">
					{#each columnTasks as task (task.id)}
						<TaskCard
							{task}
							{projects}
							{groupMembers}
							{fileUploadConfig}
							draggable
							ondragstart={(taskId) => (draggedTaskId = taskId)}
							ondragend={() => {
								draggedTaskId = null;
								dragOverStatus = null;
							}}
						/>
					{/each}

					{#if columnTasks.length === 0 && dragOverStatus !== column.value}
						<p class="font-serif text-caption text-muted-foreground">Nenhuma tarefa.</p>
					{/if}
				</div>
			</ScrollArea.Root>
		</div>
	{/each}
</div>
