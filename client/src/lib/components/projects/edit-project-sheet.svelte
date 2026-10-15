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
	let wasOpen = false;

	function toFormState(p: VisibleProject) {
		return { name: p.name, description: p.description ?? '' };
	}

	// Seed only when the sheet opens — not when `project` refreshes mid-save
	// (updateProject → invalidateAll would otherwise wipe pendingFile).
	$effect(() => {
		if (open && !wasOpen) {
			form = toFormState(project);
			imageUrl = project.image ?? null;
			pendingFile = null;
			cleared = false;
		}
		wasOpen = open;
	});

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		if (!form.name.trim()) return;

		const fileToUpload = pendingFile;
		const shouldClear = cleared && Boolean(project.image);

		submitting = true;
		try {
			// Image first, while we still hold the File snapshot.
			if (fileToUpload) {
				const uploaded = await uploadProjectImage(project.id, fileToUpload, { quiet: true });
				if (!uploaded) return;
			} else if (shouldClear) {
				const removed = await clearProjectImage(project.id, { quiet: true });
				if (!removed) return;
			}

			const ok = await updateProject(project.id, form);
			if (!ok) return;

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
