<script lang="ts">
	import { formatDateTime, formatDuration } from '$lib/tasks/format';
	import {
		kindLabel,
		priorityLabel,
		statusLabel,
		type StatusReportPayload
	} from '$lib/projects/status-report';
	import { TASK_KIND_META, TASK_STATUS_META } from '$lib/tasks/constants';
	import MarkdownDescription from '$lib/components/tasks/markdown-description.svelte';

	let {
		report,
		reportEl = $bindable<HTMLElement | null>(null)
	}: {
		report: StatusReportPayload;
		reportEl?: HTMLElement | null;
	} = $props();

	const progress = $derived(Math.min(100, Math.max(0, report.summary.progressPercent)));
	const observations = $derived(report.observations?.trim() ?? '');
	const totalTimeLabel = $derived(formatDuration(report.summary.totalResolutionSeconds));
</script>

<article
	bind:this={reportEl}
	class="status-report-doc w-full max-w-[210mm] bg-canvas text-ink"
	aria-label="Status report de {report.project.name}"
>
	<header class="border-b-2 border-frame pb-md">
		<p class="font-sans text-ui-label tracking-wide text-dell-red uppercase">SparkTask</p>
		<h1 class="font-display text-display text-pretty uppercase">Status Report</h1>
		<p class="mt-xs font-sans text-h2 uppercase">Projeto {report.project.name}</p>
		<p class="font-serif text-caption text-muted-foreground">
			{report.project.groupName} · {report.period.label}
		</p>
	</header>

	<section class="mt-lg border-2 border-frame bg-canvas p-md">
		<div class="mb-md flex flex-wrap items-end justify-between gap-sm">
			<h2 class="font-sans text-h2 uppercase">Progresso geral do projeto</h2>
			<span
				class="border border-frame bg-sticker-yellow px-sm py-xxs font-display text-h1 tabular-nums uppercase"
			>
				{progress}%
			</span>
		</div>

		<div
			class="relative h-6 w-full border-2 border-frame bg-muted"
			role="progressbar"
			aria-valuemin={0}
			aria-valuemax={100}
			aria-valuenow={progress}
			aria-label="Progresso do projeto"
		>
			<div
				class="h-full bg-tint-sage transition-[width] duration-300 ease-out motion-reduce:transition-none"
				style:width="{progress}%"
			></div>
		</div>
		<p class="mt-xs font-serif text-caption text-muted-foreground">
			Concluídas ÷ (total − canceladas). Canceladas não entram no percentual.
		</p>

		<div class="mt-md grid grid-cols-1 gap-sm sm:grid-cols-3">
			<div class="border-2 border-frame bg-tint-sky/40 px-md py-sm">
				<p class="font-sans text-ui-label uppercase text-muted-foreground">Total de tarefas</p>
				<p class="font-display text-h1 tabular-nums uppercase">{report.summary.total}</p>
			</div>
			<div class="border-2 border-frame bg-tint-peach/40 px-md py-sm">
				<p class="font-sans text-ui-label uppercase text-muted-foreground">Total de pendentes</p>
				<p class="font-display text-h1 tabular-nums uppercase">{report.summary.pending}</p>
			</div>
			<div class="border-2 border-frame bg-tint-periwinkle/40 px-md py-sm">
				<p class="font-sans text-ui-label uppercase text-muted-foreground">Tempo total gasto</p>
				<p class="font-display text-h1 tabular-nums uppercase">{totalTimeLabel}</p>
			</div>
		</div>

		<div class="mt-sm flex flex-wrap gap-xs font-serif text-caption">
			<span class="border border-frame bg-tint-sage px-xs py-xxs">
				Concluídas: <strong class="tabular-nums">{report.summary.done}</strong>
			</span>
			<span class="border border-frame bg-dell-red px-xs py-xxs text-on-red">
				Canceladas: <strong class="tabular-nums">{report.summary.cancelled}</strong>
			</span>
			{#if report.filters.kind}
				{#each report.filters.kind as k (k)}
					<span class="badge-sticker {TASK_KIND_META[k].badgeClass} px-xs py-xxs">
						{kindLabel(k)}
					</span>
				{/each}
			{/if}
		</div>
	</section>

	{#if observations}
		<section class="mt-lg border-2 border-frame bg-canvas p-md">
			<h2 class="mb-sm font-sans text-h2 uppercase">Observações</h2>
			<div class="markdown-body font-serif text-body">
				<MarkdownDescription source={observations} />
			</div>
		</section>
	{/if}

	<section class="mt-lg overflow-x-auto border-2 border-frame">
		<div class="min-w-160">
		<div
			class="grid grid-cols-[minmax(0,2fr)_minmax(0,1.1fr)_minmax(0,0.95fr)_minmax(0,0.85fr)_minmax(0,0.9fr)] gap-xs border-b-2 border-frame bg-frame px-sm py-xs font-sans text-[10px] font-bold tracking-wide text-canvas uppercase sm:text-ui-label"
		>
			<span>Tarefa</span>
			<span>Responsável</span>
			<span>Status</span>
			<span>Prioridade</span>
			<span>Resolução</span>
		</div>

		{#if report.tasks.length === 0}
			<p class="px-md py-lg font-serif text-body-sm text-muted-foreground">
				Nenhuma tarefa corresponde aos filtros selecionados.
			</p>
		{:else}
			<ul class="divide-y divide-frame">
				{#each report.tasks as row (row.id)}
					<li
						class="grid grid-cols-[minmax(0,2fr)_minmax(0,1.1fr)_minmax(0,0.95fr)_minmax(0,0.85fr)_minmax(0,0.9fr)] gap-xs px-sm py-sm font-serif text-caption sm:text-body-sm"
					>
						<div class="min-w-0">
							<p class="truncate font-medium text-pretty">{row.title}</p>
							<span
								class="mt-xxs inline-block border border-frame px-xs py-px text-[10px] font-sans font-bold uppercase {TASK_KIND_META[
									row.kind
								].badgeClass}"
							>
								{kindLabel(row.kind)}
							</span>
						</div>
						<span class="min-w-0 truncate">{row.ownerName}</span>
						<span>
							<span
								class="inline-block border border-frame px-xs py-px text-[10px] font-sans font-bold uppercase {TASK_STATUS_META[
									row.status
								].badgeClass}"
							>
								{statusLabel(row.status)}
							</span>
						</span>
						<span>{priorityLabel(row.priority)}</span>
						<span class="tabular-nums font-medium">
							{row.resolutionSeconds > 0 ? formatDuration(row.resolutionSeconds) : '—'}
						</span>
					</li>
				{/each}
			</ul>
		{/if}
		</div>
	</section>

	<footer class="mt-lg border-t border-frame pt-sm font-serif text-caption text-muted-foreground">
		Gerado em {formatDateTime(report.generatedAt) ?? '—'} · SparkTask
	</footer>
</article>
