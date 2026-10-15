<script lang="ts">
	import { browser } from '$app/environment';
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button/index.js';
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import { PrinterIcon } from '@hugeicons/core-free-icons';
	import StatusReportDocument from '$lib/components/projects/status-report-document.svelte';
	import type { StatusReportPayload } from '$lib/projects/status-report';
	import { readStatusReportForPrint } from '$lib/projects/status-report-print';

	let report = $state<StatusReportPayload | null>(null);
	let missing = $state(false);

	$effect(() => {
		if (!browser) return;
		const id = page.url.searchParams.get('id');
		if (!id) {
			missing = true;
			report = null;
			return;
		}
		const stored = readStatusReportForPrint(id);
		if (!stored) {
			missing = true;
			report = null;
			return;
		}
		report = stored;
		missing = false;
	});

	function handlePrint() {
		window.print();
	}
</script>

<svelte:head>
	<title>
		{report ? `Status Report — ${report.project.name}` : 'Status Report'} — SparkTask
	</title>
</svelte:head>

<div class="status-report-print-page min-h-dvh bg-canvas text-ink">
	{#if missing}
		<div class="mx-auto flex max-w-lg flex-col gap-md p-section">
			<h1 class="font-display text-h1 uppercase">Relatório indisponível</h1>
			<p class="font-serif text-body">
				Não encontramos dados do status report nesta aba. Volte ao projeto, gere a prévia e clique em
				“Abrir para imprimir” de novo.
			</p>
			<a href="/projects" class="btn-secondary w-fit">Voltar aos projetos</a>
		</div>
	{:else if report}
		<header
			class="print-toolbar sticky top-0 z-10 flex flex-wrap items-center justify-between gap-sm border-b-2 border-frame bg-canvas px-md py-sm md:px-lg"
		>
			<div class="min-w-0">
				<p class="font-sans text-ui-label uppercase text-muted-foreground">Modo impressão</p>
				<p class="truncate font-serif text-body-sm">
					{report.project.name} · use “Salvar como PDF” no diálogo de impressão se quiser um arquivo.
				</p>
			</div>
			<Button type="button" class="min-h-11 shrink-0" onclick={handlePrint}>
				<HugeiconsIcon icon={PrinterIcon} strokeWidth={2} data-icon="inline-start" />
				Imprimir
			</Button>
		</header>

		<div class="mx-auto max-w-[210mm] px-md py-lg md:px-lg">
			<StatusReportDocument {report} />
		</div>
	{:else}
		<p class="p-section font-serif text-caption text-muted-foreground">Carregando relatório…</p>
	{/if}
</div>

<style>
	@media print {
		@page {
			margin: 12mm;
		}

		:global(body) {
			background: #fff !important;
		}

		.status-report-print-page :global(.print-toolbar) {
			display: none !important;
		}

		.status-report-print-page {
			background: #fff !important;
		}

		.status-report-print-page :global(.status-report-doc) {
			max-width: none !important;
		}

		.status-report-print-page :global(.min-w-160) {
			min-width: 0 !important;
		}

		.status-report-print-page :global(.truncate) {
			overflow: visible !important;
			text-overflow: clip !important;
			white-space: normal !important;
		}
	}
</style>
