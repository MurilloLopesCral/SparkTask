<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { toast } from 'svelte-sonner';
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import { Download01Icon, File01Icon } from '@hugeicons/core-free-icons';
	import StatusReportDocument from './status-report-document.svelte';
	import MarkdownToolbar from '$lib/components/tasks/markdown-toolbar.svelte';
	import {
		resolvePeriodPreset,
		type StatusReportPayload,
		type StatusReportPeriodPreset
	} from '$lib/projects/status-report';
	import { downloadStatusReportPdf } from '$lib/projects/status-report-pdf';
	import {
		TASK_KINDS,
		TASK_STATUSES,
		TASK_STATUS_META,
		type TaskKind,
		type TaskStatus
	} from '$lib/tasks/constants';
	import type { VisibleProject } from '$lib/server/projects';

	let {
		project,
		open = $bindable(false)
	}: {
		project: VisibleProject;
		open?: boolean;
	} = $props();

	type TaskOption = {
		id: string;
		title: string;
		status: TaskStatus;
		kind: TaskKind;
	};

	let step = $state<'filters' | 'preview'>('filters');
	let periodPreset = $state<StatusReportPeriodPreset>('all');
	let customFrom = $state('');
	let customTo = $state('');
	let selectedStatuses = $state<TaskStatus[]>([]);
	let selectedKinds = $state<TaskKind[]>([]);
	let specificMode = $state(false);
	let selectedTaskIds = $state<string[]>([]);
	let taskOptions = $state<TaskOption[]>([]);
	let observations = $state('');
	let observationsEl = $state<HTMLTextAreaElement | null>(null);
	let loadingTasks = $state(false);
	let generating = $state(false);
	let exporting = $state(false);
	let report = $state<StatusReportPayload | null>(null);
	let reportEl = $state<HTMLElement | null>(null);

	const period = $derived(resolvePeriodPreset(periodPreset, customFrom, customTo));

	const PERIOD_OPTIONS: { value: StatusReportPeriodPreset; label: string; hint: string }[] = [
		{ value: 'all', label: 'Tudo', hint: 'Sem filtro de data' },
		{ value: 'this_week', label: 'Semana', hint: 'Segunda → hoje' },
		{ value: 'this_month', label: 'Mês', hint: 'Início do mês' },
		{ value: 'last_30', label: '30 dias', hint: 'Janela móvel' },
		{ value: 'this_quarter', label: 'Trimestre', hint: 'Trimestre atual' },
		{ value: 'custom', label: 'Custom', hint: 'Escolha as datas' }
	];

	let wasOpen = false;
	$effect(() => {
		if (open && !wasOpen) {
			step = 'filters';
			report = null;
			void loadTaskOptions();
		}
		wasOpen = open;
	});

	async function loadTaskOptions() {
		loadingTasks = true;
		try {
			const res = await fetch(`/api/projects/${project.id}/status-report?list=1`);
			if (!res.ok) {
				toast.error('Não foi possível carregar as tarefas do projeto.');
				taskOptions = [];
				return;
			}
			const data = (await res.json()) as { tasks: TaskOption[] };
			taskOptions = data.tasks ?? [];
		} finally {
			loadingTasks = false;
		}
	}

	function toggleStatus(value: TaskStatus) {
		if (selectedStatuses.includes(value)) {
			selectedStatuses = selectedStatuses.filter((s) => s !== value);
		} else {
			selectedStatuses = [...selectedStatuses, value];
		}
	}

	function toggleKind(value: TaskKind) {
		if (selectedKinds.includes(value)) {
			selectedKinds = selectedKinds.filter((k) => k !== value);
		} else {
			selectedKinds = [...selectedKinds, value];
		}
	}

	function toggleTask(id: string) {
		if (selectedTaskIds.includes(id)) {
			selectedTaskIds = selectedTaskIds.filter((t) => t !== id);
		} else {
			selectedTaskIds = [...selectedTaskIds, id];
		}
	}

	function selectAllVisibleTasks() {
		selectedTaskIds = taskOptions.map((t) => t.id);
	}

	function clearTasks() {
		selectedTaskIds = [];
	}

	async function generateReport() {
		if (periodPreset === 'custom' && !customFrom) {
			toast.error('Informe a data inicial do período.');
			return;
		}
		if (specificMode && selectedTaskIds.length === 0) {
			toast.error('Selecione ao menos uma tarefa.');
			return;
		}

		generating = true;
		try {
			const params = new URLSearchParams();
			params.set('periodLabel', period.label);
			if (period.from) params.set('createdAfter', period.from);
			if (period.to) params.set('createdBefore', period.to);
			for (const s of selectedStatuses) params.append('status', s);
			for (const k of selectedKinds) params.append('kind', k);
			if (specificMode) {
				for (const id of selectedTaskIds) params.append('taskId', id);
			}

			const res = await fetch(`/api/projects/${project.id}/status-report?${params}`);
			if (!res.ok) {
				const data = await res.json().catch(() => ({}));
				toast.error(data.message ?? 'Não foi possível gerar o relatório.');
				return;
			}
			const data = (await res.json()) as { report: StatusReportPayload };
			report = {
				...data.report,
				observations: observations.trim()
			};
			step = 'preview';
		} finally {
			generating = false;
		}
	}

	async function handleExportPdf() {
		if (!report || !reportEl) return;
		exporting = true;
		try {
			await downloadStatusReportPdf(reportEl, report);
			toast.success('PDF baixado.');
		} catch {
			toast.error('Não foi possível exportar o PDF.');
		} finally {
			exporting = false;
		}
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content
		class="flex max-h-[min(92dvh,100%)] w-[calc(100%-1rem)] max-w-3xl flex-col gap-md overflow-hidden overscroll-contain sm:max-w-3xl"
		showCloseButton={true}
	>
		<Dialog.Header class="shrink-0 gap-xxs text-left">
			<Dialog.Title class="font-display text-h1 uppercase">Status Report</Dialog.Title>
			<Dialog.Description class="font-serif text-body-sm">
				{#if step === 'filters'}
					Monte o recorte de “{project.name}” e gere um PDF para compartilhar.
				{:else}
					Prévia do relatório — confira e baixe o PDF.
				{/if}
			</Dialog.Description>
		</Dialog.Header>

		{#if step === 'filters'}
			<div class="min-h-0 flex-1 space-y-md overflow-y-auto pr-xxs">
				<section class="flex flex-col gap-xs">
					<span class="font-sans text-ui-label uppercase">Período</span>
					<p class="font-serif text-caption text-muted-foreground">
						Filtra tarefas pela data de criação (fuso America/Sao_Paulo).
					</p>
					<div class="grid grid-cols-2 gap-xs sm:grid-cols-3">
						{#each PERIOD_OPTIONS as option (option.value)}
							<button
								type="button"
								class="border-2 border-frame px-sm py-sm text-left transition-colors duration-150 hover:bg-muted focus-visible:ring-2 focus-visible:ring-frame focus-visible:outline-none {periodPreset ===
								option.value
									? 'bg-sticker-yellow'
									: 'bg-canvas'}"
								aria-pressed={periodPreset === option.value}
								onclick={() => (periodPreset = option.value)}
							>
								<span class="block font-sans text-ui-label uppercase">{option.label}</span>
								<span class="font-serif text-caption text-muted-foreground">{option.hint}</span>
							</button>
						{/each}
					</div>
					{#if periodPreset === 'custom'}
						<div class="grid grid-cols-1 gap-sm sm:grid-cols-2">
							<label class="flex flex-col gap-xxs">
								<span class="font-sans text-ui-label uppercase">De</span>
								<input
									type="date"
									class="text-input min-h-11"
									name="reportFrom"
									autocomplete="off"
									bind:value={customFrom}
								/>
							</label>
							<label class="flex flex-col gap-xxs">
								<span class="font-sans text-ui-label uppercase">Até</span>
								<input
									type="date"
									class="text-input min-h-11"
									name="reportTo"
									autocomplete="off"
									bind:value={customTo}
								/>
							</label>
						</div>
					{/if}
					<p class="font-serif text-caption text-muted-foreground">{period.label}</p>
				</section>

				<section class="flex flex-col gap-xs">
					<span class="font-sans text-ui-label uppercase">Status</span>
					<p class="font-serif text-caption text-muted-foreground">
						Vazio = todos. Toque para incluir.
					</p>
					<div class="flex flex-wrap gap-xs">
						{#each TASK_STATUSES as option (option.value)}
							<button
								type="button"
								class="badge-sticker min-h-11 px-sm py-xs transition-opacity duration-150 focus-visible:ring-2 focus-visible:ring-frame focus-visible:outline-none {option.badgeClass} {selectedStatuses.includes(
									option.value
								)
									? 'opacity-100 ring-2 ring-frame'
									: 'opacity-50 hover:opacity-90'}"
								aria-pressed={selectedStatuses.includes(option.value)}
								onclick={() => toggleStatus(option.value)}
							>
								{option.label}
							</button>
						{/each}
					</div>
				</section>

				<section class="flex flex-col gap-xs">
					<span class="font-sans text-ui-label uppercase">Classificação</span>
					<p class="font-serif text-caption text-muted-foreground">
						Erro, melhoria ou ambos (vazio = ambos).
					</p>
					<div class="flex flex-wrap gap-xs">
						{#each TASK_KINDS as option (option.value)}
							<button
								type="button"
								class="badge-sticker min-h-11 px-sm py-xs transition-opacity duration-150 focus-visible:ring-2 focus-visible:ring-frame focus-visible:outline-none {option.badgeClass} {selectedKinds.includes(
									option.value
								)
									? 'opacity-100 ring-2 ring-frame'
									: 'opacity-50 hover:opacity-90'}"
								aria-pressed={selectedKinds.includes(option.value)}
								onclick={() => toggleKind(option.value)}
							>
								{option.label}
							</button>
						{/each}
					</div>
				</section>

				<section class="flex flex-col gap-xs border-t border-frame pt-md">
					<div class="flex flex-wrap items-center justify-between gap-sm">
						<div>
							<span class="font-sans text-ui-label uppercase">Tarefas específicas</span>
							<p class="font-serif text-caption text-muted-foreground">
								Opcional — escolha só o que entra no PDF.
							</p>
						</div>
						<button
							type="button"
							class="btn-secondary min-h-11"
							aria-pressed={specificMode}
							onclick={() => {
								specificMode = !specificMode;
								if (!specificMode) selectedTaskIds = [];
							}}
						>
							{specificMode ? 'Usando seleção' : 'Ativar seleção'}
						</button>
					</div>

					{#if specificMode}
						<div class="flex flex-wrap gap-xs">
							<button type="button" class="btn-secondary min-h-11" onclick={selectAllVisibleTasks}>
								Todas
							</button>
							<button type="button" class="btn-secondary min-h-11" onclick={clearTasks}>
								Limpar
							</button>
							<span class="self-center font-serif text-caption text-muted-foreground">
								{selectedTaskIds.length} selecionada{selectedTaskIds.length === 1 ? '' : 's'}
							</span>
						</div>
						{#if loadingTasks}
							<p class="font-serif text-caption text-muted-foreground">Carregando tarefas…</p>
						{:else if taskOptions.length === 0}
							<p class="font-serif text-caption text-muted-foreground">
								Este projeto ainda não tem tarefas.
							</p>
						{:else}
							<ul
								class="max-h-48 divide-y divide-frame overflow-y-auto border border-frame bg-canvas"
							>
								{#each taskOptions as task (task.id)}
									<li>
										<label
											class="flex min-h-11 cursor-pointer items-center gap-sm px-sm py-xs hover:bg-muted"
										>
											<input
												type="checkbox"
												class="size-4 accent-dell-red"
												checked={selectedTaskIds.includes(task.id)}
												onchange={() => toggleTask(task.id)}
											/>
											<span class="min-w-0 flex-1 truncate font-serif text-body-sm"
												>{task.title}</span
											>
											<span
												class="shrink-0 border border-frame px-xs py-px text-[10px] font-sans font-bold uppercase {TASK_STATUS_META[
													task.status
												].badgeClass}"
											>
												{TASK_STATUS_META[task.status].label}
											</span>
										</label>
									</li>
								{/each}
							</ul>
						{/if}
					{/if}
				</section>

				<section class="flex flex-col gap-xs border-t border-frame pt-md">
					<span class="font-sans text-ui-label uppercase">Observações adicionais</span>
					<p class="font-serif text-caption text-muted-foreground">
						Texto livre no PDF, entre o progresso e a lista de tarefas. Aceita Markdown.
					</p>
					<div>
						<MarkdownToolbar bind:value={observations} bind:textareaEl={observationsEl} />
						<textarea
							bind:this={observationsEl}
							class="font-mono text-input min-h-28 border-t-0"
							rows="5"
							name="reportObservations"
							autocomplete="off"
							placeholder="Ex.: Bloqueios da sprint, decisões pendentes, destaques…"
							bind:value={observations}
						></textarea>
					</div>
				</section>
			</div>

			<Dialog.Footer class="shrink-0 gap-sm sm:justify-between">
				<Button type="button" variant="outline" onclick={() => (open = false)}>Cancelar</Button>
				<Button type="button" disabled={generating} onclick={generateReport}>
					<HugeiconsIcon icon={File01Icon} strokeWidth={2} data-icon="inline-start" />
					{generating ? 'Gerando…' : 'Gerar prévia'}
				</Button>
			</Dialog.Footer>
		{:else if report}
			<div class="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-muted/40 p-sm sm:p-md">
				<StatusReportDocument {report} bind:reportEl />
			</div>

			<Dialog.Footer class="shrink-0 flex-col gap-sm sm:flex-row sm:justify-between">
				<Button type="button" variant="outline" onclick={() => (step = 'filters')}>
					Voltar aos filtros
				</Button>
				<Button type="button" disabled={exporting} onclick={handleExportPdf}>
					<HugeiconsIcon icon={Download01Icon} strokeWidth={2} data-icon="inline-start" />
					{exporting ? 'Exportando…' : 'Baixar PDF'}
				</Button>
			</Dialog.Footer>
		{/if}
	</Dialog.Content>
</Dialog.Root>
