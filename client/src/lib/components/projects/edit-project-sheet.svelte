<script lang="ts">
	import { untrack } from 'svelte';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import {
		clearProjectImage,
		syncProjectToPlexus,
		updateProject,
		uploadProjectImage
	} from '$lib/projects/api';
	import { plexusFromProject } from '$lib/projects/lifecycle';
	import type { VisibleProject } from '$lib/server/projects';
	import ProjectImageField from './project-image-field.svelte';
	import ProjectLifecycleFields from './project-lifecycle-fields.svelte';
	import ProjectVersionsEditor from './project-versions-editor.svelte';

	let {
		project,
		canSyncPlexus = false,
		open = $bindable(false)
	}: {
		project: VisibleProject;
		/** Group owner — may run retroactive Plexus sync. */
		canSyncPlexus?: boolean;
		open?: boolean;
	} = $props();

	let submitting = $state(false);
	let syncing = $state(false);
	let form = $state(untrack(() => toFormState(project)));
	let imageUrl = $state<string | null>(untrack(() => project.image ?? null));
	let pendingFile = $state<File | null>(null);
	let cleared = $state(false);
	let wasOpen = false;

	const plexusReady = $derived(
		Boolean(form.plexusProjectId.trim() && form.plexusTopicCode.trim())
	);

	function toFormState(p: VisibleProject) {
		return {
			name: p.name,
			description: p.description ?? '',
			...plexusFromProject(p)
		};
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

	async function handlePlexusSync() {
		if (!canSyncPlexus || syncing) return;
		syncing = true;
		try {
			// Persist linkage first if the form has unsaved Plexus fields.
			const linkChanged =
				(form.plexusProjectId.trim() || null) !== (project.plexusProjectId ?? null) ||
				(form.plexusTopicCode.trim() || null) !== (project.plexusTopicCode ?? null);

			if (linkChanged) {
				const saved = await updateProject(project.id, form);
				if (!saved) return;
			}

			await syncProjectToPlexus(project.id);
		} finally {
			syncing = false;
		}
	}
</script>

<Sheet.Root bind:open>
	<Sheet.Content class="flex w-full flex-col overscroll-contain sm:max-w-[26rem]">
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

				<ProjectLifecycleFields bind:form showPhases={false} />

				<ProjectVersionsEditor projectId={project.id} versions={project.versions} />

				{#if canSyncPlexus}
					<div class="flex flex-col gap-sm border border-frame p-sm">
						<p class="font-sans text-ui-label uppercase">Sync retroativo</p>
						<p class="font-serif text-caption text-muted-foreground">
							Envia (ou atualiza) no Plexus o gantt de cada tarefa já existente neste projeto.
							Responsáveis sem vínculo Plexus são ignorados.
						</p>
						<Button
							type="button"
							variant="secondary"
							class="min-h-11 w-full"
							disabled={syncing || submitting || !plexusReady}
							onclick={handlePlexusSync}
						>
							{syncing ? 'Sincronizando…' : 'Sincronizar tarefas no Plexus'}
						</Button>
						{#if !plexusReady}
							<p class="font-serif text-caption text-muted-foreground">
								Preencha ID do projeto e topicCode para habilitar.
							</p>
						{/if}
					</div>
				{/if}
			</div>

			<Sheet.Footer>
				<Button type="submit" disabled={submitting || syncing}>
					{submitting ? 'Salvando…' : 'Salvar'}
				</Button>
			</Sheet.Footer>
		</form>
	</Sheet.Content>
</Sheet.Root>
