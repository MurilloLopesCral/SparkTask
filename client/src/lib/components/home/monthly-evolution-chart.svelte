<script lang="ts">
	import { LineChart } from 'layerchart';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Chart from '$lib/components/ui/chart/index.js';
	import * as Select from '$lib/components/ui/select/index.js';

	let {
		months,
		monthlyByProject,
		projects
	}: {
		months: { key: string; label: string }[];
		monthlyByProject: { monthKey: string; projectId: string; count: number }[];
		projects: { id: string; name: string }[];
	} = $props();

	let projectFilter = $state('');

	const chartConfig = {
		completed: {
			label: 'Concluídas',
			color: 'var(--chart-3)'
		}
	} satisfies Chart.ChartConfig;

	const chartData = $derived.by(() =>
		months.map((m) => {
			const completed = monthlyByProject
				.filter(
					(row) =>
						row.monthKey === m.key &&
						(!projectFilter || row.projectId === projectFilter)
				)
				.reduce((sum, row) => sum + row.count, 0);
			return { month: m.label, monthKey: m.key, completed };
		})
	);

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
		class="flex flex-col gap-sm rounded-none border-b border-frame bg-canvas px-md py-s sm:flex-row sm:items-end sm:justify-between"
	>
		<div class="min-w-0">
			<Card.Title class="font-sans text-h3 text-ink uppercase">Evolução mensal</Card.Title>
			<Card.Description class="font-serif text-caption text-muted-foreground">
				Conclusões nos últimos 6 meses
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
	</Card.Header>
	<Card.Content class="chart-mesh p-md">
		{#if projects.length === 0}
			<p class="font-serif text-body-sm text-muted-foreground">
				Nenhum projeto disponível para evoluir o gráfico.
			</p>
		{:else}
			<Chart.Container
				config={chartConfig}
				class="aspect-auto h-56 w-full [&_.lc-grid-x-line]:stroke-frame/25 [&_.lc-grid-y-line]:stroke-frame/25 [&_.lc-highlight-point]:fill-[var(--chart-3)] [&_.lc-spline-path]:stroke-[var(--chart-3)]"
			>
				<LineChart
					data={chartData}
					x="month"
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
						<Chart.Tooltip labelKey="month" indicator="line" />
					{/snippet}
				</LineChart>
			</Chart.Container>
		{/if}
	</Card.Content>
</Card.Root>
