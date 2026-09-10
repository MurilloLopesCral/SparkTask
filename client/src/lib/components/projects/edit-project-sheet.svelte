<script lang="ts">
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { updateProject } from '$lib/projects/api';
	import type { VisibleProject } from '$lib/server/projects';

	let { project, open = $bindable(false) }: { project: VisibleProject; open?: boolean } = $props();

	let submitting = $state(false);
	let form = $state(toFormState(project));

	function toFormState(p: VisibleProject) {
		return { name: p.name, description: p.description ?? '' };
	}

	// Re-seed the draft whenever the sheet is (re)opened for this project.
	$effect(() => {
		if (open) form = toFormState(project);
	});

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		if (!form.name.trim()) return;

		submitting = true;
		try {
			const ok = await updateProject(project.id, form);
			if (ok) open = false;
		} finally {
			submitting = false;
		}
	}
</script>

<Sheet.Root bind:open>
	<Sheet.Content class="flex flex-col">
		<form onsubmit={handleSubmit} class="flex h-full flex-col">
			<Sheet.Header>
				<Sheet.Title>Editar projeto</Sheet.Title>
				<Sheet.Description>Atualize as informações do projeto.</Sheet.Description>
			</Sheet.Header>

			<div class="flex flex-1 flex-col gap-md overflow-y-auto px-lg">
				<label class="flex flex-col gap-xxs">
					<span class="font-sans text-ui-label uppercase">Nome</span>
					<input class="text-input" bind:value={form.name} required />
				</label>

				<label class="flex flex-col gap-xxs">
					<span class="font-sans text-ui-label uppercase">Descrição</span>
					<textarea class="text-input" rows="3" bind:value={form.description}></textarea>
				</label>
			</div>

			<Sheet.Footer>
				<Button type="submit" disabled={submitting}>
					{submitting ? 'Salvando…' : 'Salvar'}
				</Button>
			</Sheet.Footer>
		</form>
	</Sheet.Content>
</Sheet.Root>
