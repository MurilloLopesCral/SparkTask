<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { formatDayLong } from '$lib/calendar/dates';
	import { priorityChip } from '$lib/calendar/styles';
	import type { CalendarEvent } from '$lib/calendar/types';
	import { TASK_STATUS_META, TASK_TYPE_META } from '$lib/tasks/constants';

	let {
		event = $bindable(null as CalendarEvent | null)
	}: {
		event: CalendarEvent | null;
	} = $props();

	const open = $derived(event !== null);
	const style = $derived(event ? priorityChip(event.priority) : null);

	function handleOpenChange(next: boolean) {
		if (!next) event = null;
	}

	function openTask() {
		if (!event?.taskId) return;
		void goto(resolve(`/tasks?highlight=${event.taskId}`));
		event = null;
	}
</script>

<Dialog.Root {open} onOpenChange={handleOpenChange}>
	<Dialog.Content class="max-w-md overscroll-contain border-frame">
		{#if event && style}
			<Dialog.Header>
				<Dialog.Title class="text-balance pr-lg">{event.title}</Dialog.Title>
				<Dialog.Description>
					{formatDayLong(event.date)}
					{#if event.kind === 'ghost'}
						· ocorrência prevista (ainda não materializada)
					{/if}
				</Dialog.Description>
			</Dialog.Header>

			<div class="flex flex-col gap-sm px-1">
				<div class="flex flex-wrap gap-xs">
					<Badge class={style.chip}>{style.label}</Badge>
					{#if event.type in TASK_TYPE_META}
						<Badge variant="secondary">{TASK_TYPE_META[event.type as keyof typeof TASK_TYPE_META].label}</Badge>
					{/if}
					{#if event.status && event.status in TASK_STATUS_META}
						<Badge class={TASK_STATUS_META[event.status as keyof typeof TASK_STATUS_META].badgeClass}>
							{TASK_STATUS_META[event.status as keyof typeof TASK_STATUS_META].label}
						</Badge>
					{/if}
					{#if event.kind === 'ghost'}
						<Badge variant="outline" class="border-dashed">Prevista</Badge>
					{/if}
				</div>

				<p class="font-serif text-body">
					<span class="font-sans text-ui-label uppercase text-muted-foreground">Projeto</span><br />
					{event.projectName || '—'}
				</p>
				<p class="font-serif text-body">
					<span class="font-sans text-ui-label uppercase text-muted-foreground">Responsável</span><br />
					{event.ownerName || 'Sem responsável'}
				</p>
				{#if event.description}
					<p class="line-clamp-4 font-serif text-caption text-muted-foreground whitespace-pre-wrap">
						{event.description}
					</p>
				{/if}
			</div>

			<Dialog.Footer class="gap-sm">
				{#if event.kind === 'task' && event.taskId}
					<Button type="button" onclick={openTask}>Abrir tarefa</Button>
				{:else}
					<p class="flex-1 font-serif text-caption text-muted-foreground" aria-live="polite">
						A tarefa será criada automaticamente na data de vencimento.
					</p>
				{/if}
				<Button type="button" variant="secondary" onclick={() => (event = null)}>Fechar</Button>
			</Dialog.Footer>
		{/if}
	</Dialog.Content>
</Dialog.Root>
