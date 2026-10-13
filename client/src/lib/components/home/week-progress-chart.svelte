<script lang="ts">
	import { BarChart } from 'layerchart';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Chart from '$lib/components/ui/chart/index.js';

	let {
		data
	}: {
		data: { day: string; completed: number }[];
	} = $props();

	const chartConfig = {
		completed: {
			label: 'Concluídas',
			color: 'var(--chart-1)'
		}
	} satisfies Chart.ChartConfig;

	const total = $derived(data.reduce((sum, d) => sum + d.completed, 0));
</script>

<Card.Root
	class="gap-0 rounded-none border border-frame py-0 ring-0 [--card-spacing:0]"
	style="box-shadow: 3px 3px 0 var(--frame)"
>
	<Card.Header
		class="flex flex-row items-end justify-between gap-md rounded-none border-b border-frame bg-canvas px-md py-s"
	>
		<div class="min-w-0">
			<Card.Title class="font-sans text-h3 text-ink uppercase">Progresso da semana</Card.Title>
			<Card.Description class="font-serif text-caption text-muted-foreground">
				Segunda a sexta — tarefas concluídas
			</Card.Description>
		</div>
		<span class="shrink-0 font-display text-h2 tabular-nums text-ink">{total}</span>
	</Card.Header>
	<Card.Content class="chart-mesh p-md">
		<Chart.Container
			config={chartConfig}
			class="aspect-auto h-52 w-full [&_.lc-bars-rect]:stroke-frame [&_.lc-grid-x-line]:stroke-frame/25 [&_.lc-grid-y-line]:stroke-frame/25"
		>
			<BarChart
				{data}
				x="day"
				bandPadding={0.28}
				axis="x"
				seriesLayout="group"
				series={[
					{
						key: 'completed',
						label: chartConfig.completed.label,
						color: chartConfig.completed.color
					}
				]}
			>
				{#snippet tooltip()}
					<Chart.Tooltip labelKey="day" indicator="line" />
				{/snippet}
			</BarChart>
		</Chart.Container>
	</Card.Content>
</Card.Root>
