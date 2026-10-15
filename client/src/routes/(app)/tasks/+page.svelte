<script lang="ts">
	import { page } from '$app/state';
	import { goto, invalidateAll } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { browser } from '$app/environment';
	import { toast } from 'svelte-sonner';
	import { SvelteURLSearchParams, SvelteMap } from 'svelte/reactivity';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import * as Empty from '$lib/components/ui/empty/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Toggle } from '$lib/components/ui/toggle/index.js';
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import { FilterIcon, PauseIcon, RefreshIcon, Search01Icon } from '@hugeicons/core-free-icons';
	import * as Field from '$lib/components/ui/field/index.js';
	import TaskTable from '$lib/components/tasks/task-table.svelte';
	import TaskKanban from '$lib/components/tasks/task-kanban.svelte';
	import TaskList from '$lib/components/tasks/task-list.svelte';
	import CreateTaskSheet from '$lib/components/tasks/create-task-sheet.svelte';
	import { TASK_STATUSES, TASK_PRIORITIES, TASK_TYPES } from '$lib/tasks/constants';
	import { toDateKey } from '$lib/tasks/format';
	import { pauseAllTaskExecutions } from '$lib/tasks/execution-api';
	import { IsMobile } from '$lib/hooks/is-mobile.svelte.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const isMobile = new IsMobile();
	const VIEW_STORAGE_KEY = 'sparktask:tasks-view';
	const POLL_INTERVAL_MS = 30_000;
	const SEARCH_DEBOUNCE_MS = 1_000;

	function initialView() {
		const fromUrl = page.url.searchParams.get('view');
		if (fromUrl === 'table' || fromUrl === 'kanban') return fromUrl;
		const stored = browser ? localStorage.getItem(VIEW_STORAGE_KEY) : null;
		return stored === 'kanban' ? 'kanban' : 'table';
	}

	let view = $state(initialView());
	let projectFilter = $state(page.url.searchParams.get('project') ?? 'all');
	let dueFrom = $state(page.url.searchParams.get('dueFrom') ?? '');
	let dueTo = $state(page.url.searchParams.get('dueTo') ?? '');
	let finishedFrom = $state(page.url.searchParams.get('finishedFrom') ?? '');
	let finishedTo = $state(page.url.searchParams.get('finishedTo') ?? '');
	let priorityFilter = $state(page.url.searchParams.get('priority') ?? 'all');
	let typeFilter = $state(page.url.searchParams.get('type') ?? 'all');
	let ownerFilter = $state(page.url.searchParams.get('owner') ?? 'all');
	let creatorFilter = $state(page.url.searchParams.get('creator') ?? 'all');
	let statusFilter = $state(page.url.searchParams.get('status') ?? 'all');
	let mineOnly = $state(page.url.searchParams.get('mine') === '1');
	let searchInput = $state(page.url.searchParams.get('search') ?? '');
	let searchFilter = $state(page.url.searchParams.get('search') ?? '');
	let refreshing = $state(false);
	let pausingAll = $state(false);

	// Debounce search → URL + filter (accumulates with other filters).
	$effect(() => {
		const next = searchInput;
		const timer = setTimeout(() => {
			const trimmed = next.trim();
			if (trimmed === searchFilter) return;
			searchFilter = trimmed;
			updateUrl({ search: trimmed || undefined });
		}, SEARCH_DEBOUNCE_MS);
		return () => clearTimeout(timer);
	});

	async function handleRefresh() {
		refreshing = true;
		try {
			await invalidateAll();
			toast.success('Tabela atualizada com sucesso.');
		} finally {
			refreshing = false;
		}
	}

	async function handlePauseAll() {
		if (pausingAll) return;
		pausingAll = true;
		try {
			await pauseAllTaskExecutions();
		} finally {
			pausingAll = false;
		}
	}

	// Soft live updates — silent invalidate every 30s while the tab is visible.
	$effect(() => {
		if (!browser) return;

		let timer: ReturnType<typeof setInterval> | undefined;

		const tick = () => {
			if (document.visibilityState !== 'visible') return;
			void invalidateAll();
		};

		const start = () => {
			if (timer !== undefined) return;
			timer = setInterval(tick, POLL_INTERVAL_MS);
		};

		const stop = () => {
			if (timer === undefined) return;
			clearInterval(timer);
			timer = undefined;
		};

		const onVisibility = () => {
			if (document.visibilityState === 'visible') start();
			else stop();
		};

		if (document.visibilityState === 'visible') start();
		document.addEventListener('visibilitychange', onVisibility);

		return () => {
			stop();
			document.removeEventListener('visibilitychange', onVisibility);
		};
	});

	function updateUrl(next: Record<string, string | undefined>) {
		const params = new SvelteURLSearchParams(page.url.searchParams);
		for (const [key, value] of Object.entries(next)) {
			if (value === undefined || value === 'all' || value === '') params.delete(key);
			else params.set(key, value);
		}
		goto(resolve(`/tasks?${params.toString()}`), {
			replaceState: true,
			keepFocus: true,
			noScroll: true
		});
	}

	function applyFilters(next: Record<string, string | undefined>) {
		updateUrl(next);
		toast.success('Filtros aplicados.');
	}

	function setView(next: string) {
		view = next;
		if (browser) localStorage.setItem(VIEW_STORAGE_KEY, next);
		updateUrl({ view: next });
	}

	function setProjectFilter(next: string) {
		projectFilter = next;
		updateUrl({ project: next });
	}

	function setMineOnly(pressed: boolean) {
		mineOnly = pressed;
		updateUrl({ mine: pressed ? '1' : undefined });
	}

	function clearFilters() {
		dueFrom = '';
		dueTo = '';
		finishedFrom = '';
		finishedTo = '';
		priorityFilter = 'all';
		typeFilter = 'all';
		ownerFilter = 'all';
		creatorFilter = 'all';
		statusFilter = 'all';
		updateUrl({
			dueFrom: undefined,
			dueTo: undefined,
			finishedFrom: undefined,
			finishedTo: undefined,
			priority: undefined,
			type: undefined,
			owner: undefined,
			creator: undefined,
			status: undefined
		});
	}

	const uniqueMembers = $derived.by(() => {
		const map = new SvelteMap<string, { id: string; name: string | null; email: string }>();
		for (const m of data.groupMembers) if (!map.has(m.id)) map.set(m.id, m);
		return [...map.values()];
	});

	const ownerFilterMembers = $derived(uniqueMembers.filter((m) => m.id !== data.user.id));

	$effect(() => {
		if (ownerFilter === data.user.id) {
			ownerFilter = 'all';
			updateUrl({ owner: undefined });
		}
	});

	const activeFilterCount = $derived(
		[
			dueFrom,
			dueTo,
			finishedFrom,
			finishedTo,
			priorityFilter !== 'all',
			typeFilter !== 'all',
			ownerFilter !== 'all',
			creatorFilter !== 'all',
			(isMobile.current || view === 'table') && statusFilter !== 'all'
		].filter(Boolean).length
	);

	const filteredTasks = $derived(
		data.tasks.filter((t) => {
			if (mineOnly && t.ownerId !== data.user.id) return false;
			if (projectFilter !== 'all' && t.projectId !== projectFilter) return false;
			if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
			if (typeFilter !== 'all' && t.type !== typeFilter) return false;
			if (ownerFilter === 'unassigned' && t.ownerId) return false;
			if (ownerFilter !== 'all' && ownerFilter !== 'unassigned' && t.ownerId !== ownerFilter)
				return false;
			if (creatorFilter !== 'all' && t.createdBy !== creatorFilter) return false;
			if (
				(isMobile.current || view === 'table') &&
				statusFilter !== 'all' &&
				t.status !== statusFilter
			)
				return false;
			if (dueFrom && (!t.dueDate || t.dueDate < dueFrom)) return false;
			if (dueTo && (!t.dueDate || t.dueDate > dueTo)) return false;
			if (finishedFrom || finishedTo) {
				const finishedDay = toDateKey(t.finishedAt);
				if (!finishedDay) return false;
				if (finishedFrom && finishedDay < finishedFrom) return false;
				if (finishedTo && finishedDay > finishedTo) return false;
			}
			if (searchFilter) {
				const needle = searchFilter.toLocaleLowerCase('pt-BR');
				const title = t.title.toLocaleLowerCase('pt-BR');
				const description = (t.description ?? '').toLocaleLowerCase('pt-BR');
				if (!title.includes(needle) && !description.includes(needle)) return false;
			}
			return true;
		})
	);
	const selectedProjectName = $derived(
		data.projects.find((p) => p.id === projectFilter)?.name ?? 'Todos os projetos'
	);
</script>

<svelte:head><title>Tarefas — SparkTask</title></svelte:head>

<div
	class={view === 'kanban' && !isMobile.current
		? 'flex h-[calc(100dvh-3.5rem-env(safe-area-inset-top))] flex-col p-md pb-[max(1rem,env(safe-area-inset-bottom))] md:p-lg lg:p-section'
		: 'p-md pb-[max(1rem,env(safe-area-inset-bottom))] md:p-lg lg:p-section'}
>
	<div
		class="mb-lg flex flex-col gap-lg xl:grid xl:grid-cols-[auto_minmax(16rem,1fr)_auto] xl:items-center xl:gap-xl"
	>
		<h1 class="shrink-0 font-display text-h1 text-pretty uppercase">Tarefas</h1>

		<Field.Field orientation="vertical" class="w-full min-w-0 gap-0">
			<Field.Label for="tasks-search" class="sr-only">Buscar tarefas</Field.Label>
			<div class="relative w-full">
				<HugeiconsIcon
					icon={Search01Icon}
					strokeWidth={2}
					class="pointer-events-none absolute top-1/2 left-sm size-4 -translate-y-1/2 text-muted-foreground"
					aria-hidden="true"
				/>
				<input
					id="tasks-search"
					type="search"
					name="search"
					autocomplete="off"
					spellcheck="false"
					placeholder="Buscar por título ou descrição…"
					class="text-input w-full min-h-11 ps-xl"
					bind:value={searchInput}
				/>
			</div>
		</Field.Field>

		<div class="flex w-full flex-wrap items-center gap-sm sm:gap-md xl:w-auto xl:justify-end">
			<Select.Root type="single" value={projectFilter} onValueChange={setProjectFilter}>
				<Select.Trigger class="min-h-11 w-full sm:w-48">{selectedProjectName}</Select.Trigger>
				<Select.Content>
					<Select.Item value="all" label="Todos os projetos" />
					{#each data.projects as p (p.id)}
						<Select.Item value={p.id} label={p.name} />
					{/each}
				</Select.Content>
			</Select.Root>

			<Toggle
				variant="outline"
				class="min-h-11"
				pressed={mineOnly}
				onPressedChange={setMineOnly}
				aria-label="Mostrar somente minhas tarefas"
			>
				Somente minhas
			</Toggle>

			<Popover.Root>
				<Popover.Trigger>
					{#snippet child({ props })}
						<Button {...props} variant="outline">
							<HugeiconsIcon icon={FilterIcon} strokeWidth={2} />
							Filtros
							{#if activeFilterCount > 0}
								<Badge variant="secondary" class="ml-xxs">{activeFilterCount}</Badge>
							{/if}
						</Button>
					{/snippet}
				</Popover.Trigger>
				<Popover.Content
					class="flex w-[min(calc(100vw-2rem),20rem)] flex-col gap-md"
					align="end"
				>
					<div class="flex items-center justify-between">
						<span class="font-sans text-ui-label uppercase">Filtros</span>
						<button
							type="button"
							class="cursor-pointer font-serif text-caption text-mosaic-link underline"
							onclick={clearFilters}
						>
							Limpar
						</button>
					</div>

					<div class="flex gap-sm">
						<label class="flex flex-1 flex-col gap-xxs">
							<span class="font-sans text-ui-label uppercase">Prazo de</span>
							<input
								type="date"
								class="text-input"
								name="dueFrom"
								autocomplete="off"
								bind:value={dueFrom}
								onchange={() => applyFilters({ dueFrom })}
							/>
						</label>
						<label class="flex flex-1 flex-col gap-xxs">
							<span class="font-sans text-ui-label uppercase">Prazo até</span>
							<input
								type="date"
								class="text-input"
								name="dueTo"
								autocomplete="off"
								bind:value={dueTo}
								onchange={() => applyFilters({ dueTo })}
							/>
						</label>
					</div>

					<div class="flex gap-sm">
						<label class="flex flex-1 flex-col gap-xxs">
							<span class="font-sans text-ui-label uppercase">Concluído de</span>
							<input
								type="date"
								class="text-input"
								name="finishedFrom"
								autocomplete="off"
								bind:value={finishedFrom}
								onchange={() => applyFilters({ finishedFrom })}
							/>
						</label>
						<label class="flex flex-1 flex-col gap-xxs">
							<span class="font-sans text-ui-label uppercase">Concluído até</span>
							<input
								type="date"
								class="text-input"
								name="finishedTo"
								autocomplete="off"
								bind:value={finishedTo}
								onchange={() => applyFilters({ finishedTo })}
							/>
						</label>
					</div>

					<label class="flex flex-col gap-xxs">
						<span class="font-sans text-ui-label uppercase">Prioridade</span>
						<Select.Root
							type="single"
							value={priorityFilter}
							onValueChange={(v) => {
								priorityFilter = v;
								applyFilters({ priority: v });
							}}
						>
							<Select.Trigger class="w-full">
								{priorityFilter === 'all'
									? 'Todas'
									: TASK_PRIORITIES.find((p) => p.value === priorityFilter)?.label}
							</Select.Trigger>
							<Select.Content>
								<Select.Item value="all" label="Todas" />
								{#each TASK_PRIORITIES as option (option.value)}
									<Select.Item value={option.value} label={option.label} />
								{/each}
							</Select.Content>
						</Select.Root>
					</label>

					<label class="flex flex-col gap-xxs">
						<span class="font-sans text-ui-label uppercase">Tipo</span>
						<Select.Root
							type="single"
							value={typeFilter}
							onValueChange={(v) => {
								typeFilter = v;
								applyFilters({ type: v });
							}}
						>
							<Select.Trigger class="w-full">
								{typeFilter === 'all'
									? 'Todos'
									: TASK_TYPES.find((t) => t.value === typeFilter)?.label}
							</Select.Trigger>
							<Select.Content>
								<Select.Item value="all" label="Todos" />
								{#each TASK_TYPES as option (option.value)}
									<Select.Item value={option.value} label={option.label} />
								{/each}
							</Select.Content>
						</Select.Root>
					</label>

					<label class="flex flex-col gap-xxs">
						<span class="font-sans text-ui-label uppercase">Responsável</span>
						<Select.Root
							type="single"
							value={ownerFilter}
							onValueChange={(v) => {
								ownerFilter = v;
								applyFilters({ owner: v });
							}}
						>
							<Select.Trigger class="w-full">
								{ownerFilter === 'all'
									? 'Todos'
									: ownerFilter === 'unassigned'
										? 'Sem responsável'
										: ownerFilterMembers.find((m) => m.id === ownerFilter)?.name ||
											ownerFilterMembers.find((m) => m.id === ownerFilter)?.email}
							</Select.Trigger>
							<Select.Content>
								<Select.Item value="all" label="Todos" />
								<Select.Item value="unassigned" label="Sem responsável" />
								{#each ownerFilterMembers as m (m.id)}
									<Select.Item value={m.id} label={m.name || m.email} />
								{/each}
							</Select.Content>
						</Select.Root>
					</label>

					<label class="flex flex-col gap-xxs">
						<span class="font-sans text-ui-label uppercase">Criador</span>
						<Select.Root
							type="single"
							value={creatorFilter}
							onValueChange={(v) => {
								creatorFilter = v;
								applyFilters({ creator: v });
							}}
						>
							<Select.Trigger class="w-full">
								{creatorFilter === 'all'
									? 'Todos'
									: uniqueMembers.find((m) => m.id === creatorFilter)?.name ||
										uniqueMembers.find((m) => m.id === creatorFilter)?.email}
							</Select.Trigger>
							<Select.Content>
								<Select.Item value="all" label="Todos" />
								{#each uniqueMembers as m (m.id)}
									<Select.Item value={m.id} label={m.name || m.email} />
								{/each}
							</Select.Content>
						</Select.Root>
					</label>

					{#if isMobile.current || view === 'table'}
						<label class="flex flex-col gap-xxs">
							<span class="font-sans text-ui-label uppercase">Status</span>
							<Select.Root
								type="single"
								value={statusFilter}
								onValueChange={(v) => {
									statusFilter = v;
									applyFilters({ status: v });
								}}
							>
								<Select.Trigger class="w-full">
									{statusFilter === 'all'
										? 'Todos'
										: TASK_STATUSES.find((s) => s.value === statusFilter)?.label}
								</Select.Trigger>
								<Select.Content>
									<Select.Item value="all" label="Todos" />
									{#each TASK_STATUSES as option (option.value)}
										<Select.Item value={option.value} label={option.label} />
									{/each}
								</Select.Content>
							</Select.Root>
						</label>
					{/if}
				</Popover.Content>
			</Popover.Root>

			<Tooltip.Root>
				<Tooltip.Trigger>
					{#snippet child({ props })}
						<Button
							{...props}
							variant="outline"
							size="icon"
							class="min-h-11 min-w-11"
							disabled={pausingAll}
							onclick={handlePauseAll}
						>
							<HugeiconsIcon icon={PauseIcon} strokeWidth={2} />
							<span class="sr-only">Pausar todas as execuções</span>
						</Button>
					{/snippet}
				</Tooltip.Trigger>
				<Tooltip.Content>Pausar todas as execuções</Tooltip.Content>
			</Tooltip.Root>

			<Tooltip.Root>
				<Tooltip.Trigger>
					{#snippet child({ props })}
						<Button
							{...props}
							variant="outline"
							size="icon"
							class="min-h-11 min-w-11"
							disabled={refreshing}
							onclick={handleRefresh}
						>
							<HugeiconsIcon
								icon={RefreshIcon}
								strokeWidth={2}
								class={refreshing ? 'animate-spin' : ''}
							/>
							<span class="sr-only">Atualizar tarefas</span>
						</Button>
					{/snippet}
				</Tooltip.Trigger>
				<Tooltip.Content>Atualizar tarefas</Tooltip.Content>
			</Tooltip.Root>

			<div class="hidden md:block">
				<Tabs.Root value={view} onValueChange={setView}>
					<Tabs.List>
						<Tabs.Trigger value="table">Tabela</Tabs.Trigger>
						<Tabs.Trigger value="kanban">Kanban</Tabs.Trigger>
					</Tabs.List>
				</Tabs.Root>
			</div>

			<CreateTaskSheet projects={data.projects} groupMembers={data.groupMembers} />
		</div>
	</div>

	{#if data.tasks.length === 0}
		<Empty.Root>
			<Empty.Header>
				<Empty.Title>Nenhuma tarefa ainda</Empty.Title>
				<Empty.Description>As tarefas dos seus grupos vão aparecer aqui.</Empty.Description>
			</Empty.Header>
			<Empty.Content>
				<CreateTaskSheet projects={data.projects} groupMembers={data.groupMembers} />
			</Empty.Content>
		</Empty.Root>
	{:else if filteredTasks.length === 0}
		<Empty.Root>
			<Empty.Header>
				<Empty.Title>Nenhuma tarefa encontrada</Empty.Title>
				<Empty.Description>Ajuste os filtros para ver outras tarefas.</Empty.Description>
			</Empty.Header>
		</Empty.Root>
	{:else if isMobile.current}
		<TaskList
			tasks={filteredTasks}
			projects={data.projects}
			groupMembers={data.groupMembers}
			fileUploadConfig={data.fileUploadConfig}
		/>
	{:else if view === 'kanban'}
		<div class="min-h-0 flex-1">
			<TaskKanban
				tasks={filteredTasks}
				projects={data.projects}
				groupMembers={data.groupMembers}
				fileUploadConfig={data.fileUploadConfig}
			/>
		</div>
	{:else}
		<TaskTable
			tasks={filteredTasks}
			projects={data.projects}
			groupMembers={data.groupMembers}
			fileUploadConfig={data.fileUploadConfig}
		/>
	{/if}
</div>
