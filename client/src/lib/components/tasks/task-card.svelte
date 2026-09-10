<script lang="ts">
	import { Card } from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import SvelteMarkdown from 'svelte-markdown';
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import {
		MoreVerticalIcon,
		Delete02Icon,
		Edit02Icon,
		CheckmarkCircle02Icon,
		Calendar03Icon,
		Attachment01Icon
	} from '@hugeicons/core-free-icons';
	import StatusBadge from './status-badge.svelte';
	import TaskDetailsDialog from './task-details-dialog.svelte';
	import TaskConfettiBurst from './task-confetti-burst.svelte';
	import { TASK_STATUSES, TASK_PRIORITY_META, TASK_TYPE_META } from '$lib/tasks/constants';
	import { formatDate, dueDateStatusClass } from '$lib/tasks/format';
	import { getInitials } from '$lib/users/format';
	import { setTaskStatus, removeTask } from '$lib/tasks/api';
	import type { FileUploadConfig } from '$lib/tasks/files-api';
	import type { VisibleTask } from '$lib/server/tasks';

	let {
		task,
		groupMembers,
		fileUploadConfig,
		ondragstart,
		ondragend
	}: {
		task: VisibleTask;
		groupMembers: { groupId: string; id: string; name: string | null; email: string }[];
		fileUploadConfig: FileUploadConfig;
		ondragstart: (taskId: string) => void;
		ondragend: () => void;
	} = $props();

	let detailsOpen = $state(false);
	let startEditing = $state(false);

	const dueDate = $derived(formatDate(task.dueDate));
	const dueDateClass = $derived(dueDateStatusClass(task.dueDate));
	const ownerName = $derived(task.owner?.name || task.owner?.email || 'Sem responsável');
	const ownerInitials = $derived(task.owner ? getInitials(task.owner.name, task.owner.email) : '—');

	function openDetails() {
		startEditing = false;
		detailsOpen = true;
	}

	function openForEditing() {
		startEditing = true;
		detailsOpen = true;
	}
</script>

<div class="relative">
	<Card
		draggable={true}
		ondragstart={() => ondragstart(task.id)}
		ondragend={() => ondragend()}
		onclick={openDetails}
		class="task-card group/task-card cursor-grab gap-sm p-md active:cursor-grabbing"
	>
		<Badge variant="outline" class="badge-sticker w-fit">{task.project.name}</Badge>

		<div class="flex items-start justify-between gap-sm">
			<p class="flex-1 font-sans text-h3 uppercase">{task.title}</p>

			<div
				role="presentation"
				onclick={(e) => e.stopPropagation()}
				class="opacity-0 transition-opacity group-focus-within/task-card:opacity-100 group-hover/task-card:opacity-100"
			>
				<DropdownMenu.Root>
					<DropdownMenu.Trigger>
						{#snippet child({ props })}
							<button type="button" class="grid size-6 place-items-center" {...props}>
								<HugeiconsIcon icon={MoreVerticalIcon} strokeWidth={2} />
								<span class="sr-only">Ações da tarefa</span>
							</button>
						{/snippet}
					</DropdownMenu.Trigger>
					<DropdownMenu.Content align="end">
						<DropdownMenu.Item onSelect={openForEditing}>
							<HugeiconsIcon icon={Edit02Icon} strokeWidth={2} />
							Editar
						</DropdownMenu.Item>
						<DropdownMenu.Sub>
							<DropdownMenu.SubTrigger>
								<HugeiconsIcon icon={CheckmarkCircle02Icon} strokeWidth={2} />
								Mudar status
							</DropdownMenu.SubTrigger>
							<DropdownMenu.SubContent>
								{#each TASK_STATUSES as option (option.value)}
									<DropdownMenu.Item
										disabled={option.value === task.status}
										onSelect={() => setTaskStatus(task.id, option.value)}
									>
										{option.label}
									</DropdownMenu.Item>
								{/each}
							</DropdownMenu.SubContent>
						</DropdownMenu.Sub>
						<DropdownMenu.Separator />
						<DropdownMenu.Item variant="destructive" onSelect={() => removeTask(task.id)}>
							<HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
							Excluir
						</DropdownMenu.Item>
					</DropdownMenu.Content>
				</DropdownMenu.Root>
			</div>
		</div>

		{#if task.description}
			<div class="markdown-body line-clamp-3 font-serif text-body-sm text-muted-foreground">
				<SvelteMarkdown source={task.description} />
			</div>
		{/if}

		<div class="flex flex-wrap items-center gap-xs">
			<StatusBadge status={task.status} />
			<Badge variant="outline" class="badge-sticker"
				>{TASK_PRIORITY_META[task.priority].label}</Badge
			>
			<Badge variant="outline" class="badge-sticker">{TASK_TYPE_META[task.type].label}</Badge>
		</div>

		<div
			class="flex items-center justify-between gap-sm font-serif text-caption text-muted-foreground"
		>
			<span class="flex items-center gap-xxs font-bold">
				<Avatar.Root size="sm" class="size-6">
					<Avatar.Image src={task.owner?.image} alt={ownerName} />
					<Avatar.Fallback class="text-[10px]">{ownerInitials}</Avatar.Fallback>
				</Avatar.Root>
				{ownerName}
			</span>
			<span class="flex items-center gap-sm">
				{#if task.files.length > 0}
					<span class="flex items-center gap-xxs">
						<HugeiconsIcon icon={Attachment01Icon} strokeWidth={2} class="size-3" />
						{task.files.length}
					</span>
				{/if}
				{#if dueDate}
					<span class="flex items-center gap-xxs font-medium {dueDateClass}">
						<HugeiconsIcon icon={Calendar03Icon} strokeWidth={2} class="size-3" />
						{dueDate}
					</span>
				{/if}
			</span>
		</div>
	</Card>
	<TaskConfettiBurst taskId={task.id} />
</div>

<TaskDetailsDialog
	{task}
	{groupMembers}
	{fileUploadConfig}
	bind:open={detailsOpen}
	initialEditing={startEditing}
/>
