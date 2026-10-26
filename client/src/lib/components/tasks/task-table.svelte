<script lang="ts">
	import * as Table from '$lib/components/ui/table/index.js';
	import * as ContextMenu from '$lib/components/ui/context-menu/index.js';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import { mergeProps } from 'bits-ui';
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import {
		Delete02Icon,
		Edit02Icon,
		CheckmarkCircle02Icon,
		Attachment01Icon
	} from '@hugeicons/core-free-icons';
	import { cn } from '$lib/utils.js';
	import StatusBadge from './status-badge.svelte';
	import TaskDetailsDialog from './task-details-dialog.svelte';
	import TaskConfettiBurst from './task-confetti-burst.svelte';
	import ProjectIcon from '$lib/components/projects/project-icon.svelte';
	import TaskOwnerSelect from './task-owner-select.svelte';
	import { TASK_STATUSES, TASK_PRIORITY_META } from '$lib/tasks/constants';
	import { formatDate, dueDateStatusClass } from '$lib/tasks/format';
	import { setTaskStatus, removeTask } from '$lib/tasks/api';
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

	// Track the id, not the task object — after a save triggers invalidateAll(),
	// `tasks` gets fresh objects; deriving from the id keeps the dialog showing
	// the live row instead of a stale snapshot taken at click-time.
	let dialogTaskId = $state<string | null>(null);
	let dialogOpen = $state(false);
	let dialogEditing = $state(false);

	const dialogTask = $derived(tasks.find((t) => t.id === dialogTaskId) ?? null);

	function viewTask(task: VisibleTask) {
		dialogTaskId = task.id;
		dialogEditing = false;
		dialogOpen = true;
	}

	function editTask(task: VisibleTask) {
		dialogTaskId = task.id;
		dialogEditing = true;
		dialogOpen = true;
	}
</script>

<Table.Root class="data-table">
	<Table.Header>
		<Table.Row>
			<Table.Head>Tarefa</Table.Head>
			<Table.Head>Projeto</Table.Head>
			<Table.Head>Responsável</Table.Head>
			<Table.Head>Prioridade</Table.Head>
			<Table.Head>Status</Table.Head>
			<Table.Head>Prazo / Conclusão</Table.Head>
			<Table.Head class="w-0"><span class="sr-only">Arquivos</span></Table.Head>
		</Table.Row>
	</Table.Header>
	<Table.Body>
		{#each tasks as task (task.id)}
			<ContextMenu.Root>
				<Tooltip.Root>
					<Tooltip.Trigger>
						{#snippet child({ props: tooltipProps })}
							<ContextMenu.Trigger>
								{#snippet child({ props: contextMenuProps })}
									{@const mergedProps = mergeProps(contextMenuProps, tooltipProps)}
									<tr
										{...mergedProps}
										data-slot="table-row"
										onclick={() => viewTask(task)}
										class={cn(
											'cursor-pointer border-b transition-colors hover:bg-muted/50',
											mergedProps.class as string | undefined
										)}
									>
										<Table.Cell class="font-sans font-medium">{task.title}</Table.Cell>
										<Table.Cell>
											<span class="flex min-w-0 items-center gap-xs">
												{#if task.project.image}
													<ProjectIcon src={task.project.image} alt="" size="sm" />
												{/if}
												<span class="min-w-0 truncate">{task.project.name}</span>
											</span>
										</Table.Cell>
										<Table.Cell>
											<TaskOwnerSelect
												taskId={task.id}
												ownerId={task.ownerId}
												owner={task.owner}
												members={groupMembers.filter((m) => m.groupId === task.project.groupId)}
											/>
										</Table.Cell>
										<Table.Cell>{TASK_PRIORITY_META[task.priority].label}</Table.Cell>
										<Table.Cell class="relative">
											<StatusBadge status={task.status} />
											<TaskConfettiBurst taskId={task.id} />
										</Table.Cell>
										<Table.Cell
											class="font-medium {task.status === 'done'
												? 'text-tint-sage'
												: dueDateStatusClass(task.dueDate)}"
										>
											{#if task.status === 'done'}
												{formatDate(task.finishedAt) ?? '—'}
											{:else}
												{formatDate(task.dueDate) ?? '—'}
											{/if}
										</Table.Cell>
										<Table.Cell class="w-0">
											{#if task.files.length > 0}
												<span class="flex items-center gap-xxs text-caption text-muted-foreground">
													<HugeiconsIcon icon={Attachment01Icon} strokeWidth={2} class="size-3" />
													{task.files.length}
												</span>
											{/if}
										</Table.Cell>
									</tr>
								{/snippet}
							</ContextMenu.Trigger>
						{/snippet}
					</Tooltip.Trigger>
					<Tooltip.Content>Clique para visualizar</Tooltip.Content>
				</Tooltip.Root>
				<ContextMenu.Content>
					<ContextMenu.Item onSelect={() => editTask(task)}>
						<HugeiconsIcon icon={Edit02Icon} strokeWidth={2} />
						Editar
					</ContextMenu.Item>
					<ContextMenu.Sub>
						<ContextMenu.SubTrigger>
							<HugeiconsIcon icon={CheckmarkCircle02Icon} strokeWidth={2} />
							Mudar status
						</ContextMenu.SubTrigger>
						<ContextMenu.SubContent>
							{#each TASK_STATUSES as option (option.value)}
								<ContextMenu.Item
									disabled={option.value === task.status}
									onSelect={() => setTaskStatus(task.id, option.value)}
								>
									{option.label}
								</ContextMenu.Item>
							{/each}
						</ContextMenu.SubContent>
					</ContextMenu.Sub>
					<ContextMenu.Separator />
					<ContextMenu.Item variant="destructive" onSelect={() => removeTask(task.id)}>
						<HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
						Excluir
					</ContextMenu.Item>
				</ContextMenu.Content>
			</ContextMenu.Root>
		{/each}
	</Table.Body>
</Table.Root>

{#if dialogTask}
	<TaskDetailsDialog
		task={dialogTask}
		{projects}
		{groupMembers}
		{fileUploadConfig}
		bind:open={dialogOpen}
		initialEditing={dialogEditing}
	/>
{/if}
