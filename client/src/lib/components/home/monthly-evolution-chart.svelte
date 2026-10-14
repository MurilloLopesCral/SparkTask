<script lang="ts">
	import { LineChart } from 'layerchart';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Chart from '$lib/components/ui/chart/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import * as ToggleGroup from '$lib/components/ui/toggle-group/index.js';

	type Range = 'current' | '1' | '3' | '6';

	const RANGES: { value: Range; label: string; hint: string; months: number }[] = [
		{ value: 'current', label: 'Mês atual', hint: 'Conclusões por dia neste mês', months: 1 },
		{ value: '1', label: '1 mês', hint: 'Conclusões do mês corrente', months: 1 },
		{ value: '3', label: '3 meses', hint: 'Conclusões nos últimos 3 meses', months: 3 },
		{ value: '6', label: '6 meses', hint: 'Conclusões nos últimos 6 meses', months: 6 }
	];

	let {
		months,
		currentMonthDays,
		monthlyByProject,
		currentMonthDailyByProject,
		projects
	}: {
		months: { key: string; label: string }[];
		currentMonthDays: { key: string; label: string }[];
		monthlyByProject: { monthKey: string; projectId: string; count: number }[];
		currentMonthDailyByProject: { dayKey: string; projectId: string; count: number }[];
		projects: { id: string; name: string }[];
	} = $props();

	let projectFilter = $state('');
	let range = $state<Range>('3');

	const chartConfig = {
		completed: {
			label: 'Concluídas',
			color: 'var(--chart-3)'
		}
	} satisfies Chart.ChartConfig;

	const activeRange = $derived(RANGES.find((r) => r.value === range) ?? RANGES[2]);

	const chartData = $derived.by(() => {
		if (range === 'current') {
			return currentMonthDays.map((d) => {
				const completed = currentMonthDailyByProject
					.filter(
						(row) =>
							row.dayKey === d.key &&
							(!projectFilter || row.projectId === projectFilter)
					)
					.reduce((sum, row) => sum + row.count, 0);
				return { period: d.label, completed };
			});
		}

		const window = months.slice(-activeRange.months);
		return window.map((m) => {
			const completed = monthlyByProject
				.filter(
					(row) =>
						row.monthKey === m.key &&
						(!projectFilter || row.projectId === projectFilter)
				)
				.reduce((sum, row) => sum + row.count, 0);
			return { period: m.label, completed };
		});
	});

	const selectedProjectLabel = $derived(
		projectFilter
			? (projects.find((p) => p.id === projectFilter)?.name ?? 'Projeto')
			: 'Todos os projetos'
	);
</script>

<Card.Root
	class="gap-0 rounded-none border border-frame py-0 ring-0 [--card-spacing:0]"
	style="box-shadow: 3px 3px 0 var(--frame)"
>
	<Card.Header
		class="flex flex-col gap-sm rounded-none border-b border-frame bg-canvas px-md py-s"
	>
		<div class="flex flex-col gap-sm sm:flex-row sm:items-end sm:justify-between">
			<div class="min-w-0">
				<Card.Title class="font-sans text-h3 text-ink uppercase">Evolução mensal</Card.Title>
				<Card.Description class="font-serif text-caption text-muted-foreground">
					{activeRange.hint}
				</Card.Description>
			</div>
			<label class="flex min-w-0 flex-col gap-xxs sm:w-56">
				<span class="font-sans text-ui-label uppercase">Projeto</span>
				<Select.Root type="single" bind:value={projectFilter}>
					<Select.Trigger class="w-full" aria-label="Filtrar evolução por projeto">
						{selectedProjectLabel}
					</Select.Trigger>
					<Select.Content>
						<Select.Item value="" label="Todos os projetos" />
						{#each projects as p (p.id)}
							<Select.Item value={p.id} label={p.name} />
						{/each}
					</Select.Content>
				</Select.Root>
			</label>
		</div>

		<div class="flex flex-col gap-xxs">
			<span class="font-sans text-ui-label uppercase">Período</span>
			<ToggleGroup.Root
				type="single"
				bind:value={range}
				variant="outline"
				class="flex w-full flex-wrap justify-start gap-0 border border-frame"
				aria-label="Granularidade do período"
			>
				{#each RANGES as option (option.value)}
					<ToggleGroup.Item
						value={option.value}
						class="min-h-11 flex-1 rounded-none border-0 border-r border-frame px-sm font-sans text-ui-label uppercase last:border-r-0 data-[state=on]:bg-frame data-[state=on]:text-canvas"
					>
						{option.label}
					</ToggleGroup.Item>
				{/each}
			</ToggleGroup.Root>
		</div>
	</Card.Header>
	<Card.Content class="chart-mesh p-md">
		{#if projects.length === 0}
			<p class="font-serif text-body-sm text-muted-foreground">
				Nenhum projeto disponível para evoluir o gráfico.
			</p>
		{:else}
			<Chart.Container
				config={chartConfig}
				class="aspect-auto h-56 w-full [&_.lc-grid-x-line]:stroke-frame/15 [&_.lc-grid-y-line]:stroke-frame/15 [&_.lc-highlight-point]:fill-[var(--chart-3)] [&_.lc-line]:stroke-[var(--chart-3)] [&_.lc-spline-path]:stroke-[var(--chart-3)]"
			>
				<LineChart
					data={chartData}
					x="period"
					axis="x"
					series={[
						{
							key: 'completed',
							label: chartConfig.completed.label,
							color: chartConfig.completed.color
						}
					]}
				>
					{#snippet tooltip()}
						<Chart.Tooltip labelKey="period" indicator="line" />
					{/snippet}
				</LineChart>
			</Chart.Container>
		{/if}
	</Card.Content>
</Card.Root>
