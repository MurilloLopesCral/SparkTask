<script lang="ts">
	import { BarChart } from 'layerchart';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Chart from '$lib/components/ui/chart/index.js';

	let {
		data
	}: {
		data: { project: string; tasks: number }[];
	} = $props();

	const chartConfig = {
		tasks: {
			label: 'Tarefas',
			color: 'var(--chart-4)'
		}
	} satisfies Chart.ChartConfig;

	const total = $derived(data.reduce((sum, d) => sum + d.tasks, 0));

	/** Short labels so many projects still fit on the x-axis. */
	const chartData = $derived(
		data.map((d) => ({
			...d,
			label: d.project.length > 14 ? `${d.project.slice(0, 13)}…` : d.project
		}))
	);
</script>

<Card.Root
	class="gap-0 rounded-none border border-frame py-0 ring-0 [--card-spacing:0]"
	style="box-shadow: 3px 3px 0 var(--frame)"
>
	<Card.Header
		class="flex flex-row items-end justify-between gap-md rounded-none border-b border-frame bg-canvas px-md py-s"
	>
		<div class="min-w-0">
			<Card.Title class="font-sans text-h3 text-ink uppercase">Tarefas por projeto</Card.Title>
			<Card.Description class="font-serif text-caption text-muted-foreground">
				Volume total em cada projeto do grupo
			</Card.Description>
		</div>
		<span class="shrink-0 font-display text-h2 tabular-nums text-ink">{total}</span>
	</Card.Header>
	<Card.Content class="chart-mesh p-md">
		{#if data.length === 0}
			<p class="font-serif text-body-sm text-muted-foreground">Nenhum projeto para listar.</p>
		{:else}
			<Chart.Container
				config={chartConfig}
				class="aspect-auto h-56 w-full [&_.lc-bars-rect]:stroke-frame [&_.lc-grid-x-line]:stroke-frame/25 [&_.lc-grid-y-line]:stroke-frame/25"
			>
				<BarChart
					data={chartData}
					x="label"
					bandPadding={0.28}
					axis="x"
					seriesLayout="group"
					series={[
						{
							key: 'tasks',
							label: chartConfig.tasks.label,
							color: chartConfig.tasks.color
						}
					]}
				>
					{#snippet tooltip()}
						<Chart.Tooltip labelKey="label" indicator="line" />
					{/snippet}
				</BarChart>
			</Chart.Container>
		{/if}
	</Card.Content>
</Card.Root>
