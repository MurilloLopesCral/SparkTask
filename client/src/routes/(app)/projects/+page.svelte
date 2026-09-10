<script lang="ts">
	import * as Empty from '$lib/components/ui/empty/index.js';
	import CreateProjectSheet from '$lib/components/projects/create-project-sheet.svelte';
	import ProjectCard from '$lib/components/projects/project-card.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head><title>Projetos — SparkTask</title></svelte:head>

<div class="p-lg lg:p-section">
	<div class="mb-lg flex flex-wrap items-center justify-between gap-md">
		<h1 class="font-display text-h1 uppercase">Projetos</h1>
		<CreateProjectSheet groups={data.groups} />
	</div>

	{#if data.projects.length === 0}
		<Empty.Root>
			<Empty.Header>
				<Empty.Title>Nenhum projeto ainda</Empty.Title>
				<Empty.Description>Cadastre o primeiro projeto do seu grupo.</Empty.Description>
			</Empty.Header>
			<Empty.Content>
				<CreateProjectSheet groups={data.groups} />
			</Empty.Content>
		</Empty.Root>
	{:else}
		<div class="grid grid-cols-1 gap-md sm:grid-cols-2 lg:grid-cols-3">
			{#each data.projects as project (project.id)}
				<ProjectCard {project} />
			{/each}
		</div>
	{/if}
</div>
