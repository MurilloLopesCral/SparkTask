<script lang="ts">
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import {
		clearProjectImage,
		updateProject,
		uploadProjectImage
	} from '$lib/projects/api';
	import type { VisibleProject } from '$lib/server/projects';
	import ProjectImageField from './project-image-field.svelte';

	let { project, open = $bindable(false) }: { project: VisibleProject; open?: boolean } = $props();

	let submitting = $state(false);
	let form = $state(toFormState(project));
	let imageUrl = $state<string | null>(project.image ?? null);
	let pendingFile = $state<File | null>(null);
	let cleared = $state(false);

	function toFormState(p: VisibleProject) {
		return { name: p.name, description: p.description ?? '' };
	}

	$effect(() => {
		if (open) {
			form = toFormState(project);
			imageUrl = project.image ?? null;
			pendingFile = null;
			cleared = false;
		}
	});

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		if (!form.name.trim()) return;

		submitting = true;
		try {
			const ok = await updateProject(project.id, form);
			if (!ok) return;

			if (pendingFile) {
				await uploadProjectImage(project.id, pendingFile, { quiet: true });
			} else if (cleared && project.image) {
				await clearProjectImage(project.id, { quiet: true });
			}

			open = false;
		} finally {
			submitting = false;
		}
	}
</script>

<Sheet.Root bind:open>
	<Sheet.Content class="flex w-full flex-col overscroll-contain sm:max-w-[24rem]">
		<form onsubmit={handleSubmit} class="flex h-full flex-col">
			<Sheet.Header>
				<Sheet.Title>Editar projeto</Sheet.Title>
				<Sheet.Description>Atualize as informações do projeto.</Sheet.Description>
			</Sheet.Header>

			<div class="flex flex-1 flex-col gap-md overflow-y-auto px-lg">
				<ProjectImageField
					bind:imageUrl
					bind:pendingFile
					bind:cleared
					projectName={form.name.trim() || project.name}
				/>

				<label class="flex flex-col gap-xxs">
					<span class="font-sans text-ui-label uppercase">Nome</span>
					<input
						class="text-input"
						name="projectName"
						autocomplete="off"
						bind:value={form.name}
						required
					/>
				</label>

				<label class="flex flex-col gap-xxs">
					<span class="font-sans text-ui-label uppercase">Descrição</span>
					<textarea
						class="text-input"
						name="projectDescription"
						autocomplete="off"
						rows="3"
						bind:value={form.description}
					></textarea>
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
