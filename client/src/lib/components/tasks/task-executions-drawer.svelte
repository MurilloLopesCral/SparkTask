<script lang="ts">
	import * as Drawer from '$lib/components/ui/drawer/index.js';
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import { formatDateTime, formatDuration } from '$lib/tasks/format';
	import { getInitials } from '$lib/users/format';
	import {
		fetchTaskExecutions,
		type TaskExecutionRow
	} from '$lib/tasks/execution-api';

	let {
		taskId,
		taskTitle,
		open = $bindable(false)
	}: {
		taskId: string;
		taskTitle: string;
		open?: boolean;
	} = $props();

	let loading = $state(false);
	let executions = $state<TaskExecutionRow[]>([]);

	const END_REASON_LABEL: Record<string, string> = {
		paused: 'Pausada',
		completed: 'Concluída',
		auto_closed: 'Encerrada automaticamente'
	};

	$effect(() => {
		if (!open) return;
		void loadExecutions(taskId);
	});

	async function loadExecutions(id: string) {
		loading = true;
		try {
			executions = await fetchTaskExecutions(id);
		} finally {
			loading = false;
		}
	}

	function durationLabel(row: TaskExecutionRow) {
		const start = new Date(row.startedAt).getTime();
		const end = row.endedAt ? new Date(row.endedAt).getTime() : Date.now();
		return formatDuration((end - start) / 1000);
	}

	function userLabel(row: TaskExecutionRow) {
		return row.user.name || row.user.email;
	}
</script>

<Drawer.Root bind:open direction="right">
	<Drawer.Content
		class="data-[vaul-drawer-direction=right]:inset-y-2 data-[vaul-drawer-direction=right]:right-2 data-[vaul-drawer-direction=right]:left-auto data-[vaul-drawer-direction=right]:h-auto data-[vaul-drawer-direction=right]:w-[min(100%,24rem)]"
	>
		<Drawer.Header class="border-b border-frame pb-md">
			<Drawer.Title class="font-sans text-h3 uppercase">Execuções</Drawer.Title>
			<Drawer.Description class="font-serif text-caption text-muted-foreground">
				Inícios e términos de “{taskTitle}”.
			</Drawer.Description>
		</Drawer.Header>

		<div class="flex min-h-0 flex-1 flex-col gap-sm overflow-y-auto px-lg py-md">
			{#if loading}
				<p class="font-serif text-caption text-muted-foreground">Carregando…</p>
			{:else if executions.length === 0}
				<p class="font-serif text-caption text-muted-foreground">
					Nenhuma execução registrada nesta tarefa.
				</p>
			{:else}
				<ul class="flex flex-col gap-sm">
					{#each executions as row (row.id)}
						<li class="border border-frame bg-canvas px-sm py-sm">
							<div class="mb-xs flex items-center gap-xs">
								<Avatar.Root size="sm" class="size-6">
									<Avatar.Image src={row.user.image} alt={userLabel(row)} />
									<Avatar.Fallback class="text-[10px]">
										{getInitials(row.user.name, row.user.email)}
									</Avatar.Fallback>
								</Avatar.Root>
								<span class="truncate font-serif text-body-sm">{userLabel(row)}</span>
								{#if !row.endedAt}
									<span
										class="ms-auto border border-frame bg-sticker-yellow px-xs py-xxs font-sans text-[10px] font-bold tracking-wide text-ink uppercase"
									>
										Em andamento
									</span>
								{:else if row.endReason}
									<span
										class="ms-auto font-sans text-[10px] font-bold tracking-wide text-muted-foreground uppercase"
									>
										{END_REASON_LABEL[row.endReason] ?? row.endReason}
									</span>
								{/if}
							</div>

							<dl class="grid grid-cols-[auto_1fr] gap-x-sm gap-y-xxs font-serif text-caption">
								<dt class="text-muted-foreground">Início</dt>
								<dd>{formatDateTime(row.startedAt) ?? '—'}</dd>
								<dt class="text-muted-foreground">Término</dt>
								<dd>{row.endedAt ? (formatDateTime(row.endedAt) ?? '—') : '—'}</dd>
								<dt class="text-muted-foreground">Duração</dt>
								<dd class="font-medium">{durationLabel(row)}</dd>
							</dl>
						</li>
					{/each}
				</ul>
			{/if}
		</div>
	</Drawer.Content>
</Drawer.Root>
