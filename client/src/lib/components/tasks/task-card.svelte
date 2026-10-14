<script lang="ts">
	import { Card } from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import MarkdownDescription from './markdown-description.svelte';
	import {
		MoreVerticalIcon,
		Delete02Icon,
		Edit02Icon,
		CheckmarkCircle02Icon,
		Calendar03Icon,
		Attachment01Icon,
		PlayIcon,
		PauseIcon
	} from '@hugeicons/core-free-icons';
	import StatusBadge from './status-badge.svelte';
	import TaskDetailsDialog from './task-details-dialog.svelte';
	import TaskConfettiBurst from './task-confetti-burst.svelte';
	import { TASK_STATUSES, TASK_PRIORITY_META, TASK_TYPE_META } from '$lib/tasks/constants';
	import { formatDate, dueDateStatusClass } from '$lib/tasks/format';
	import { getInitials } from '$lib/users/format';
	import { setTaskStatus, removeTask } from '$lib/tasks/api';
	import {
		finishTaskExecution,
		pauseTaskExecution,
		startTaskExecution
	} from '$lib/tasks/execution-api';
	import type { FileUploadConfig } from '$lib/tasks/files-api';
	import type { VisibleTask } from '$lib/server/tasks';

	let {
		task,
		projects,
		groupMembers,
		fileUploadConfig,
		ondragstart,
		ondragend,
		draggable = false
	}: {
		task: VisibleTask;
		projects: { id: string; name: string; groupId: string }[];
		groupMembers: { groupId: string; id: string; name: string | null; email: string }[];
		fileUploadConfig: FileUploadConfig;
		ondragstart?: (taskId: string) => void;
		ondragend?: () => void;
		draggable?: boolean;
	} = $props();

	let detailsOpen = $state(false);
	let startEditing = $state(false);
	let busyAction = $state<'start' | 'pause' | 'finish' | null>(null);

	const dueDate = $derived(formatDate(task.dueDate));
	const dueDateClass = $derived(dueDateStatusClass(task.dueDate));
	const ownerName = $derived(task.owner?.name || task.owner?.email || 'Sem responsável');
	const ownerInitials = $derived(task.owner ? getInitials(task.owner.name, task.owner.email) : '—');

	const canExecute = $derived(task.status !== 'done' && task.status !== 'cancelled');
	const activeExecution = $derived(task.executions[0] ?? null);
	const isRunning = $derived(Boolean(activeExecution));

	function openDetails() {
		startEditing = false;
		detailsOpen = true;
	}

	function openForEditing() {
		startEditing = true;
		detailsOpen = true;
	}

	async function runExecution(action: 'start' | 'pause' | 'finish') {
		if (busyAction) return;
		busyAction = action;
		try {
			if (action === 'start') await startTaskExecution(task.id);
			else if (action === 'pause') await pauseTaskExecution(task.id);
			else await finishTaskExecution(task.id);
		} finally {
			busyAction = null;
		}
	}
</script>

<div class="relative">
	<Card
		draggable={draggable}
		ondragstart={draggable ? () => ondragstart?.(task.id) : undefined}
		ondragend={draggable ? () => ondragend?.() : undefined}
		onclick={openDetails}
		class="task-card group/task-card gap-sm p-md {draggable
			? 'cursor-grab transition-[transform,box-shadow] duration-150 hover:z-10 hover:scale-[1.02] hover:shadow-[4px_4px_0_var(--frame)] active:cursor-grabbing active:scale-100 active:shadow-none'
			: 'cursor-pointer'}"
	>
		<Badge variant="outline" class="badge-sticker w-fit">{task.project.name}</Badge>

		<div class="flex items-start justify-between gap-sm">
			<p class="min-w-0 flex-1 font-sans text-h3 uppercase text-pretty">{task.title}</p>

			<div
				role="presentation"
				onclick={(e) => e.stopPropagation()}
				class="opacity-100 transition-opacity md:opacity-0 md:group-focus-within/task-card:opacity-100 md:group-hover/task-card:opacity-100"
			>
				<DropdownMenu.Root>
					<DropdownMenu.Trigger>
						{#snippet child({ props })}
							<button
								type="button"
								class="grid size-11 place-items-center md:size-6"
								{...props}
							>
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
				<MarkdownDescription source={task.description} />
			</div>
		{/if}

		<div class="flex flex-wrap items-center gap-xs">
			<StatusBadge status={task.status} />
			<Badge variant="outline" class="badge-sticker"
				>{TASK_PRIORITY_META[task.priority].label}</Badge
			>
			<Badge variant="outline" class="badge-sticker">{TASK_TYPE_META[task.type].label}</Badge>
			{#if isRunning}
				<span
					class="border border-frame bg-sticker-yellow px-xs py-xxs font-sans text-[10px] font-bold tracking-wide text-ink uppercase"
				>
					Em execução
				</span>
			{/if}
		</div>

		{#if canExecute}
			<div
				role="presentation"
				onclick={(e) => e.stopPropagation()}
				class="flex flex-wrap items-center gap-xs border-t border-frame/20 pt-sm"
			>
				{#if !isRunning}
					<Button
						size="sm"
						disabled={busyAction !== null}
						onclick={() => runExecution('start')}
					>
						<HugeiconsIcon icon={PlayIcon} strokeWidth={2} data-icon="inline-start" />
						{busyAction === 'start' ? 'Iniciando…' : 'Iniciar'}
					</Button>
				{:else}
					<Button
						size="sm"
						variant="outline"
						disabled={busyAction !== null}
						onclick={() => runExecution('pause')}
					>
						<HugeiconsIcon icon={PauseIcon} strokeWidth={2} data-icon="inline-start" />
						{busyAction === 'pause' ? 'Pausando…' : 'Pausar'}
					</Button>
					<Button
						size="sm"
						disabled={busyAction !== null}
						onclick={() => runExecution('finish')}
					>
						<HugeiconsIcon icon={CheckmarkCircle02Icon} strokeWidth={2} data-icon="inline-start" />
						{busyAction === 'finish' ? 'Finalizando…' : 'Finalizar'}
					</Button>
				{/if}
			</div>
		{/if}

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
				{#if dueDate && task.status !== 'done'}
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
	{projects}
	{groupMembers}
	{fileUploadConfig}
	bind:open={detailsOpen}
	initialEditing={startEditing}
/>
