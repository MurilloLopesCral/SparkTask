<script lang="ts">
	import {
		activeProjectsPerMonth,
		buildMonthColumns,
		phaseBarPlacement,
		phasesForProject,
		projectHasRoadmapDates,
		type RoadmapProject
	} from '$lib/calendar/project-roadmap';

	let {
		projects,
		anchorYear,
		selectedProjectId = null
	}: {
		projects: RoadmapProject[];
		anchorYear: number;
		selectedProjectId?: string | null;
	} = $props();

	const filtered = $derived(
		selectedProjectId ? projects.filter((p) => p.id === selectedProjectId) : projects
	);

	const dated = $derived(filtered.filter(projectHasRoadmapDates));
	const undated = $derived(filtered.filter((p) => !projectHasRoadmapDates(p)));
	const columns = $derived(buildMonthColumns(dated, anchorYear));
	const activeCounts = $derived(activeProjectsPerMonth(dated, columns));
	const monthCount = $derived(columns.length);

	function barStyle(startCol: number, span: number) {
		const left = ((startCol - 1) / monthCount) * 100;
		const width = (span / monthCount) * 100;
		return `left:${left}%;width:${width}%`;
	}
</script>

{#if filtered.length === 0}
	<div class="border border-frame bg-canvas px-md py-section text-center">
		<p class="font-serif text-body text-muted-foreground">
			Nenhum projeto neste grupo. Crie um projeto e defina as fases do roadmap.
		</p>
	</div>
{:else if dated.length === 0}
	<div class="border border-frame bg-canvas px-md py-section text-center">
		<p class="font-serif text-body text-muted-foreground">
			Nenhum projeto com datas de fase. Edite um projeto e preencha Implementação, QO ou QP.
		</p>
	</div>
{:else}
	<div class="overflow-x-auto border border-frame bg-canvas">
		<div class="min-w-[42rem]">
			<div class="flex border-b border-frame">
				<div
					class="w-[13rem] shrink-0 border-r border-frame px-sm py-xs font-sans text-ui-label uppercase"
				>
					Projeto
				</div>
				<div class="flex min-w-0 flex-1">
					{#each columns as col, i (col.key)}
						<div
							class="flex flex-1 flex-col items-center justify-center border-r border-frame px-xxs py-xs last:border-r-0"
							style:min-width="3.25rem"
							title={`${col.label}: ${activeCounts[i]} projeto(s) ativos`}
						>
							<span class="font-sans text-[0.65rem] uppercase leading-tight tabular-nums">
								{col.label}
							</span>
							<span class="font-serif text-caption tabular-nums text-muted-foreground">
								{activeCounts[i]}
							</span>
						</div>
					{/each}
				</div>
			</div>

			{#each dated as project (project.id)}
				{@const phases = phasesForProject(project)}
				<div class="flex border-b border-frame last:border-b-0">
					<div
						class="flex w-[13rem] shrink-0 flex-col justify-center gap-xxs border-r border-frame px-sm py-sm"
					>
						<span class="font-sans text-sm font-medium text-pretty">{project.name}</span>
						{#if project.plexusProjectId}
							<span class="font-serif text-caption text-muted-foreground">
								Plexus: {project.plexusProjectId}
							</span>
						{/if}
					</div>

					<div class="relative min-h-[5rem] min-w-0 flex-1 py-sm">
						<div class="pointer-events-none absolute inset-0 flex" aria-hidden="true">
							{#each columns as col (col.key)}
								<div class="flex-1 border-r border-frame/40 last:border-r-0" style:min-width="3.25rem"></div>
							{/each}
						</div>

						<div class="relative flex flex-col gap-[0.35rem] px-0.5">
							{#each phases as phase (phase.key)}
								{@const place = phaseBarPlacement(phase, columns)}
								<div class="relative h-[1.15rem]">
									{#if place}
										<div
											class={[
												'absolute inset-y-0 flex items-center overflow-hidden px-1 font-sans text-[0.65rem] uppercase tracking-wide',
												phase.barClass
											]}
											style={barStyle(place.startCol, place.span)}
											title={`${phase.label}: ${phase.start ?? '—'} → ${phase.end ?? '—'}`}
										>
											<span class="truncate">{phase.shortLabel}</span>
										</div>
									{/if}
								</div>
							{/each}
						</div>
					</div>
				</div>
			{/each}
		</div>
	</div>

	<div class="mt-md flex flex-wrap items-center gap-md font-serif text-caption text-muted-foreground">
		<span class="inline-flex items-center gap-1">
			<span class="size-2 bg-tint-sky" aria-hidden="true"></span> Implementação
		</span>
		<span class="inline-flex items-center gap-1">
			<span class="size-2 bg-tint-peach" aria-hidden="true"></span> QO — Operação assistida
		</span>
		<span class="inline-flex items-center gap-1">
			<span class="size-2 bg-tint-sage" aria-hidden="true"></span> QP — Desempenho
		</span>
	</div>
{/if}

{#if undated.length > 0}
	<details class="mt-md border border-frame bg-canvas px-md py-sm">
		<summary class="cursor-pointer font-sans text-ui-label uppercase">
			Sem datas de roadmap ({undated.length})
		</summary>
		<ul class="mt-sm flex flex-col gap-xxs font-serif text-body text-muted-foreground">
			{#each undated as project (project.id)}
				<li>{project.name}</li>
			{/each}
		</ul>
	</details>
{/if}
