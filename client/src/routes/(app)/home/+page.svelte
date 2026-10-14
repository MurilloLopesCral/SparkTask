<script lang="ts">
	import StatCard from '$lib/components/home/stat-card.svelte';
	import WeekProgressChart from '$lib/components/home/week-progress-chart.svelte';
	import MonthlyEvolutionChart from '$lib/components/home/monthly-evolution-chart.svelte';
	import TasksByProjectChart from '$lib/components/home/tasks-by-project-chart.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const { userStats, groupStats } = $derived(data.dashboard);

	const groupHeading = $derived(
		data.groups.length === 1 ? data.groups[0].name : 'Seus grupos'
	);

	const dailyAverageLabel = $derived(
		new Intl.NumberFormat('pt-BR', {
			minimumFractionDigits: Number.isInteger(userStats.dailyAverage) ? 0 : 1,
			maximumFractionDigits: 1
		}).format(userStats.dailyAverage)
	);

	const groupAverageLabel = $derived(
		new Intl.NumberFormat('pt-BR', {
			minimumFractionDigits: Number.isInteger(groupStats.averageTasks) ? 0 : 1,
			maximumFractionDigits: 1
		}).format(groupStats.averageTasks)
	);

	const resolutionLabel = $derived(formatResolution(userStats.averageResolutionSeconds));

	function formatResolution(seconds: number | null) {
		if (seconds == null || seconds <= 0) return '—';
		const hours = Math.floor(seconds / 3600);
		const minutes = Math.round((seconds % 3600) / 60);
		if (hours === 0) return `${minutes} min`;
		if (minutes === 0) return `${hours}h`;
		return `${hours}h ${minutes}min`;
	}
</script>

<svelte:head><title>Início — SparkTask</title></svelte:head>

<div class="flex flex-col gap-section p-md pb-[max(1rem,env(safe-area-inset-bottom))] md:p-lg lg:p-section">
	<header>
		<h1 class="font-display text-h1 text-pretty uppercase">
			Olá, {data.user.name || data.user.email}.
		</h1>
		<p class="mt-xs max-w-prose font-serif text-body text-muted-foreground">
			Painel do dia — o que está com você e o que o grupo está movendo.
		</p>
	</header>

	<section aria-labelledby="home-user-heading" class="flex flex-col gap-md">
		<h2 id="home-user-heading" class="section-eyebrow section-eyebrow--olive">Você</h2>

		<div class="grid grid-cols-1 gap-md sm:grid-cols-2 lg:grid-cols-4">
			<StatCard
				label="Tarefas pendentes"
				value={userStats.pendingTasks}
				hint="Não iniciadas, em andamento ou em espera"
				tint="salmon"
			/>
			<StatCard
				label="Concluídas no mês"
				value={userStats.completedThisMonth}
				hint="Marcadas como feitas neste mês"
				tint="lime"
			/>
			<StatCard
				label="Média diária"
				value={dailyAverageLabel}
				hint="Conclusões ÷ dias úteis decorridos no mês"
				tint="sky"
			/>
			<StatCard
				label="Média de resolução"
				value={resolutionLabel}
				hint="Tempo médio em execução até concluir"
				tint="steel"
			/>
		</div>

		<WeekProgressChart data={userStats.weekProgress} />
	</section>

	<section aria-labelledby="home-group-heading" class="flex flex-col gap-md">
		<h2 id="home-group-heading" class="section-eyebrow section-eyebrow--salmon">
			{groupHeading}
		</h2>

		<div class="grid grid-cols-1 gap-md sm:grid-cols-2">
			<StatCard
				label="Média do grupo"
				value={groupAverageLabel}
				hint={`Total de tarefas ÷ ${groupStats.memberCount || '—'} membros`}
				tint="periwinkle"
			/>
			<StatCard
				label="Total de tarefas"
				value={groupStats.totalTasks}
				hint="Soma de todos os projetos visíveis"
				tint="peach"
			/>
		</div>

		<TasksByProjectChart data={groupStats.tasksByProject} />

		<MonthlyEvolutionChart
			months={groupStats.months}
			currentMonthDays={groupStats.currentMonthDays}
			monthlyByProject={groupStats.monthlyByProject}
			currentMonthDailyByProject={groupStats.currentMonthDailyByProject}
			projects={groupStats.projects}
		/>
	</section>
</div>
