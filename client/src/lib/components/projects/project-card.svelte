<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import { MoreVerticalIcon, Edit02Icon, Delete02Icon } from '@hugeicons/core-free-icons';
	import EditProjectSheet from './edit-project-sheet.svelte';
	import { removeProject } from '$lib/projects/api';
	import type { VisibleProject } from '$lib/server/projects';

	let { project }: { project: VisibleProject } = $props();

	let editOpen = $state(false);
</script>

<Card.Root class="card-bevel group/project-card relative rounded-none ring-0">
	<div class="absolute top-4 right-4">
		<DropdownMenu.Root>
			<DropdownMenu.Trigger>
				{#snippet child({ props })}
					<button type="button" class="grid size-6 place-items-center" {...props}>
						<HugeiconsIcon icon={MoreVerticalIcon} strokeWidth={2} />
						<span class="sr-only">Ações do projeto</span>
					</button>
				{/snippet}
			</DropdownMenu.Trigger>
			<DropdownMenu.Content align="end">
				<DropdownMenu.Item onSelect={() => (editOpen = true)}>
					<HugeiconsIcon icon={Edit02Icon} strokeWidth={2} />
					Editar
				</DropdownMenu.Item>
				<DropdownMenu.Separator />
				<DropdownMenu.Item variant="destructive" onSelect={() => removeProject(project.id)}>
					<HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
					Excluir
				</DropdownMenu.Item>
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	</div>

	<Card.Header>
		<Card.Title class="pr-8 font-sans text-h3 uppercase">{project.name}</Card.Title>
		<Card.Description>{project.group.name}</Card.Description>
	</Card.Header>
	<Card.Content class="flex flex-col gap-sm">
		{#if project.description}
			<p class="font-serif text-body-sm text-muted-foreground">{project.description}</p>
		{/if}
		<Badge variant={project.isActive ? 'secondary' : 'outline'}>
			{project.isActive ? 'Ativo' : 'Inativo'}
		</Badge>
	</Card.Content>
</Card.Root>

<EditProjectSheet {project} bind:open={editOpen} />
