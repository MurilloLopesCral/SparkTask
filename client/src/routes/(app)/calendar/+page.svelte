<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button/index.js';
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import {
		ArrowLeft01Icon,
		ArrowRight01Icon,
		Calendar03Icon,
		GridIcon,
		Menu01Icon,
		RefreshIcon
	} from '@hugeicons/core-free-icons';
	import MonthGrid from '$lib/components/calendar/month-grid.svelte';
	import WeekGrid from '$lib/components/calendar/week-grid.svelte';
	import ListView from '$lib/components/calendar/list-view.svelte';
	import EventDetailDialog from '$lib/components/calendar/event-detail-dialog.svelte';
	import CreateTaskSheet from '$lib/components/tasks/create-task-sheet.svelte';
	import RecurrenceSheet from '$lib/components/recurrence/recurrence-sheet.svelte';
	import {
		addMonths,
		addDays,
		formatMonthTitle,
		parseYmd,
		toYmd,
		startOfWeek
	} from '$lib/calendar/dates';
	import type { CalendarEvent, CalendarViewMode } from '$lib/calendar/types';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let selectedEvent = $state<CalendarEvent | null>(null);
	let refreshing = $state(false);
	let taskSheetOpen = $state(false);
	let taskDueDate = $state('');
	let recurrenceSheetOpen = $state(false);
	let recurrenceStartFrom = $state('');

	const anchor = $derived(parseYmd(data.anchorDate));
	const view = $derived(data.view as CalendarViewMode);

	const periodLabel = $derived.by(() => {
		if (view === 'week') {
			const start = startOfWeek(anchor);
			const end = addDays(start, 6);
			return `${toYmd(start)} → ${toYmd(end)}`;
		}
		return formatMonthTitle(anchor);
	});

	function updateUrl(patch: Record<string, string | undefined>) {
		const params = new URLSearchParams(page.url.searchParams);
		for (const [key, value] of Object.entries(patch)) {
			if (value === undefined || value === '') params.delete(key);
			else params.set(key, value);
		}
		void goto(resolve(`/calendar?${params.toString()}`), {
			replaceState: true,
			keepFocus: true,
			noScroll: true
		});
	}

	function setView(next: CalendarViewMode) {
		updateUrl({ view: next === 'month' ? undefined : next });
	}

	function setGroup(groupId: string) {
		// Changing group clears a project that may not exist in the new group.
		updateUrl({ group: groupId, project: undefined });
	}

	function setProject(projectId: string) {
		updateUrl({ project: projectId === 'all' ? undefined : projectId });
	}

	function setScope(scope: 'mine' | 'group') {
		updateUrl({
			scope: scope === 'mine' ? 'mine' : undefined,
			mine: undefined
		});
	}

	function shiftPeriod(delta: number) {
		const next = view === 'week' ? addDays(anchor, delta * 7) : addMonths(anchor, delta);
		updateUrl({ date: toYmd(next) });
	}

	function goToday() {
		updateUrl({ date: toYmd(new Date()) });
	}

	function openCreateTask(date: string) {
		taskDueDate = date;
		taskSheetOpen = true;
	}

	function openCreateRecurrence(date: string) {
		recurrenceStartFrom = date;
		recurrenceSheetOpen = true;
	}

	async function handleRefresh() {
		refreshing = true;
		try {
			await invalidateAll();
		} finally {
			refreshing = false;
		}
	}
</script>

<svelte:head><title>Calendário — SparkTask</title></svelte:head>

<div
	class="flex flex-col gap-section p-md pb-[max(1rem,env(safe-area-inset-bottom))] md:p-lg lg:p-section"
>
	<header class="flex flex-col gap-md">
		<div class="flex flex-wrap items-end justify-between gap-md">
			<div>
				<p class="section-eyebrow section-eyebrow--olive">Agenda</p>
				<h1 class="font-display text-h1 uppercase text-pretty">Calendário</h1>
				<p class="mt-xs max-w-prose font-serif text-body text-muted-foreground">
					Prazos do grupo e previsões de recorrência. Clique com o botão direito em um dia para
					criar tarefa ou recorrência.
				</p>
			</div>
			<div class="flex flex-wrap gap-xs">
				<Button
					type="button"
					variant="secondary"
					href={resolve('/recurrences')}
					class="min-h-11 touch-manipulation"
				>
					Gerenciar recorrências
				</Button>
				<Button
					type="button"
					variant="secondary"
					onclick={handleRefresh}
					disabled={refreshing}
					aria-label="Atualizar calendário"
					class="min-h-11 touch-manipulation"
				>
					<HugeiconsIcon
						icon={RefreshIcon}
						strokeWidth={2}
						class={refreshing ? 'animate-spin' : ''}
					/>
					{refreshing ? 'Atualizando…' : 'Atualizar'}
				</Button>
			</div>
		</div>

		<div class="flex flex-col gap-sm border border-frame bg-canvas p-md">
			<div class="flex flex-wrap items-center gap-sm">
				{#if data.groups.length > 0}
					<label class="flex min-w-[12rem] flex-1 flex-col gap-xxs">
						<span class="font-sans text-ui-label uppercase">Grupo</span>
						<select
							class="text-input"
							name="group"
							value={data.selectedGroupId ?? ''}
							onchange={(e) => setGroup(e.currentTarget.value)}
						>
							{#each data.groups as group (group.id)}
								<option value={group.id}>{group.name}</option>
							{/each}
						</select>
					</label>
				{/if}

				<label class="flex min-w-[12rem] flex-1 flex-col gap-xxs">
					<span class="font-sans text-ui-label uppercase">Projeto</span>
					<select
						class="text-input"
						name="project"
						value={data.selectedProjectId ?? 'all'}
						onchange={(e) => setProject(e.currentTarget.value)}
					>
						<option value="all">Todos os projetos</option>
						{#each data.projects as project (project.id)}
							<option value={project.id}>{project.name}</option>
						{/each}
					</select>
				</label>

				<div class="flex flex-col gap-xxs">
					<span class="font-sans text-ui-label uppercase">Escopo</span>
					<div class="flex border border-frame" role="group" aria-label="Escopo do calendário">
						<Button
							type="button"
							variant={data.scope === 'mine' ? 'default' : 'secondary'}
							size="sm"
							class="min-h-11 rounded-none border-0 touch-manipulation"
							aria-pressed={data.scope === 'mine'}
							onclick={() => setScope('mine')}
						>
							Meu calendário
						</Button>
						<Button
							type="button"
							variant={data.scope === 'group' ? 'default' : 'secondary'}
							size="sm"
							class="min-h-11 rounded-none border-0 border-l border-frame touch-manipulation"
							aria-pressed={data.scope === 'group'}
							onclick={() => setScope('group')}
						>
							Calendário do grupo
						</Button>
					</div>
				</div>

				<div class="flex flex-col gap-xxs">
					<span class="font-sans text-ui-label uppercase">Visão</span>
					<div class="flex border border-frame" role="group" aria-label="Modo de visualização">
						<Button
							type="button"
							variant={view === 'month' ? 'default' : 'secondary'}
							size="sm"
							class="rounded-none border-0"
							aria-pressed={view === 'month'}
							onclick={() => setView('month')}
						>
							<HugeiconsIcon icon={Calendar03Icon} strokeWidth={2} class="size-4" />
							<span class="hidden sm:inline">Mês</span>
						</Button>
						<Button
							type="button"
							variant={view === 'week' ? 'default' : 'secondary'}
							size="sm"
							class="rounded-none border-0 border-l border-frame"
							aria-pressed={view === 'week'}
							onclick={() => setView('week')}
						>
							<HugeiconsIcon icon={GridIcon} strokeWidth={2} class="size-4" />
							<span class="hidden sm:inline">Semana</span>
						</Button>
						<Button
							type="button"
							variant={view === 'list' ? 'default' : 'secondary'}
							size="sm"
							class="rounded-none border-0 border-l border-frame"
							aria-pressed={view === 'list'}
							onclick={() => setView('list')}
						>
							<HugeiconsIcon icon={Menu01Icon} strokeWidth={2} class="size-4" />
							<span class="hidden sm:inline">Lista</span>
						</Button>
					</div>
				</div>
			</div>

			<div class="flex flex-wrap items-center justify-between gap-sm">
				<div class="flex items-center gap-xs">
					<Button
						type="button"
						variant="secondary"
						size="icon"
						class="size-11 touch-manipulation"
						aria-label="Período anterior"
						onclick={() => shiftPeriod(-1)}
					>
						<HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} />
					</Button>
					<Button
						type="button"
						variant="secondary"
						size="icon"
						class="size-11 touch-manipulation"
						aria-label="Próximo período"
						onclick={() => shiftPeriod(1)}
					>
						<HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} />
					</Button>
					<Button type="button" variant="secondary" onclick={goToday}>Hoje</Button>
				</div>
				<p class="font-sans text-h3 uppercase tabular-nums text-pretty" aria-live="polite">
					{periodLabel}
				</p>
			</div>
		</div>
	</header>

	{#if !data.selectedGroupId}
		<div class="border border-frame bg-canvas px-md py-section text-center">
			<p class="font-serif text-body text-muted-foreground">
				Você precisa participar de um grupo para ver o calendário.
			</p>
		</div>
	{:else if view === 'month'}
		<MonthGrid
			{anchor}
			events={data.events}
			onSelect={(e) => (selectedEvent = e)}
			onCreateTask={openCreateTask}
			onCreateRecurrence={openCreateRecurrence}
		/>
	{:else if view === 'week'}
		<WeekGrid
			{anchor}
			events={data.events}
			onSelect={(e) => (selectedEvent = e)}
			onCreateTask={openCreateTask}
			onCreateRecurrence={openCreateRecurrence}
		/>
	{:else}
		<ListView events={data.events} onSelect={(e) => (selectedEvent = e)} />
	{/if}

	<div class="flex flex-wrap items-center gap-md font-serif text-caption text-muted-foreground">
		<span class="inline-flex items-center gap-1">
			<span class="size-2 bg-tint-sky" aria-hidden="true"></span> Tarefa com prazo
		</span>
		<span class="inline-flex items-center gap-1">
			<span class="size-2 border border-dashed border-frame/50 bg-muted" aria-hidden="true"></span>
			Ocorrência prevista (recorrência)
		</span>
	</div>
</div>

<EventDetailDialog bind:event={selectedEvent} />

{#if data.projects.length > 0}
	<CreateTaskSheet
		projects={data.projects}
		groupMembers={data.groupMembers}
		showTrigger={false}
		initialDueDate={taskDueDate}
		bind:open={taskSheetOpen}
	/>
	<RecurrenceSheet
		projects={data.projects}
		groupMembers={data.groupMembers}
		initialStartFrom={recurrenceStartFrom}
		bind:open={recurrenceSheetOpen}
	/>
{/if}
