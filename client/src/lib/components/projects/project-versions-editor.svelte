<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Switch } from '$lib/components/ui/switch/index.js';
	import {
		createProjectVersion,
		deleteProjectVersion,
		updateProjectVersion
	} from '$lib/projects/api';
	import { phasePayload, phasesFromVersion, type VersionPhaseForm } from '$lib/projects/lifecycle';

	type VersionRow = {
		id: string;
		label: string;
		title: string | null;
		description: string | null;
		sortOrder: number;
		plexusSyncEnabled: boolean;
		implementationStart: string | null;
		implementationEnd: string | null;
		assistedOpsStart: string | null;
		assistedOpsEnd: string | null;
		performanceStart: string | null;
		performanceEnd: string | null;
	};

	let { projectId, versions }: { projectId: string; versions: VersionRow[] } = $props();

	type VersionDraft = VersionPhaseForm & {
		title: string;
		description: string;
		plexusSyncEnabled: boolean;
	};

	let drafts = $state<Record<string, VersionDraft>>({});
	let seededIds = $state('');
	let savingId = $state<string | null>(null);
	let deletingId = $state<string | null>(null);
	let creating = $state(false);

	const canDelete = $derived(versions.length > 1);

	function draftFromVersion(v: VersionRow): VersionDraft {
		return {
			...phasesFromVersion(v),
			title: v.title ?? '',
			description: v.description ?? '',
			plexusSyncEnabled: v.plexusSyncEnabled
		};
	}

	// Reseed only when versions are added/removed — invalidateAll must not wipe edits.
	$effect(() => {
		const ids = versions.map((v) => v.id).join(',');
		if (ids === seededIds) return;
		seededIds = ids;
		const next: Record<string, VersionDraft> = {};
		for (const v of versions) next[v.id] = draftFromVersion(v);
		drafts = next;
	});

	async function saveVersion(versionId: string) {
		const draft = drafts[versionId];
		if (!draft || savingId) return;
		savingId = versionId;
		try {
			await updateProjectVersion(projectId, versionId, {
				...phasePayload(draft),
				title: draft.title.trim() || null,
				description: draft.description.trim() || null,
				plexusSyncEnabled: draft.plexusSyncEnabled
			});
		} finally {
			savingId = null;
		}
	}

	async function toggleSync(versionId: string, checked: boolean) {
		const draft = drafts[versionId];
		if (!draft) return;
		draft.plexusSyncEnabled = checked;
		await updateProjectVersion(projectId, versionId, { plexusSyncEnabled: checked });
	}

	async function addVersion() {
		if (creating) return;
		creating = true;
		try {
			await createProjectVersion(projectId);
		} finally {
			creating = false;
		}
	}

	async function removeVersion(versionId: string) {
		if (!canDelete || deletingId) return;
		deletingId = versionId;
		try {
			await deleteProjectVersion(projectId, versionId);
		} finally {
			deletingId = null;
		}
	}
</script>

<div class="flex flex-col gap-sm border border-frame p-sm">
	<div class="flex items-center justify-between gap-sm">
		<p class="font-sans text-ui-label uppercase">Versões</p>
		<Button
			type="button"
			variant="secondary"
			size="sm"
			class="min-h-11"
			disabled={creating}
			onclick={addVersion}
		>
			{creating ? 'Criando…' : 'Nova versão'}
		</Button>
	</div>

	{#each versions as version (version.id)}
		{@const draft = drafts[version.id]}
		{#if draft}
			<div class="flex flex-col gap-sm border border-frame/60 p-sm">
				<div class="flex items-center justify-between gap-sm">
					<span class="font-sans text-sm font-medium">{version.label}</span>
					<label class="flex min-h-11 items-center gap-sm">
						<span class="font-serif text-caption text-muted-foreground">Integra Plexus</span>
						<Switch
							checked={draft.plexusSyncEnabled}
							onCheckedChange={(checked) => toggleSync(version.id, checked)}
							aria-label={`Integra Plexus — ${version.label}`}
						/>
					</label>
				</div>

				<label class="flex flex-col gap-xxs">
					<span class="font-serif text-caption text-muted-foreground">Título</span>
					<input
						class="text-input"
						bind:value={draft.title}
						placeholder="Ex.: Go-live varejo"
						maxlength="255"
						autocomplete="off"
					/>
				</label>

				<label class="flex flex-col gap-xxs">
					<span class="font-serif text-caption text-muted-foreground">Descrição</span>
					<textarea
						class="text-input"
						rows="2"
						bind:value={draft.description}
						placeholder="Escopo desta versão…"
					></textarea>
				</label>

				<div class="grid grid-cols-2 gap-sm">
					<label class="flex flex-col gap-xxs">
						<span class="font-serif text-caption text-muted-foreground">Impl. início</span>
						<input class="text-input" type="date" bind:value={draft.implementationStart} />
					</label>
					<label class="flex flex-col gap-xxs">
						<span class="font-serif text-caption text-muted-foreground">Impl. fim</span>
						<input class="text-input" type="date" bind:value={draft.implementationEnd} />
					</label>
					<label class="flex flex-col gap-xxs">
						<span class="font-serif text-caption text-muted-foreground">QO início</span>
						<input class="text-input" type="date" bind:value={draft.assistedOpsStart} />
					</label>
					<label class="flex flex-col gap-xxs">
						<span class="font-serif text-caption text-muted-foreground">QO fim</span>
						<input class="text-input" type="date" bind:value={draft.assistedOpsEnd} />
					</label>
					<label class="flex flex-col gap-xxs">
						<span class="font-serif text-caption text-muted-foreground">QP início</span>
						<input class="text-input" type="date" bind:value={draft.performanceStart} />
					</label>
					<label class="flex flex-col gap-xxs">
						<span class="font-serif text-caption text-muted-foreground">QP fim</span>
						<input class="text-input" type="date" bind:value={draft.performanceEnd} />
					</label>
				</div>

				<div class="flex flex-col gap-sm sm:flex-row">
					<Button
						type="button"
						variant="secondary"
						size="sm"
						class="min-h-11 flex-1"
						disabled={savingId === version.id || deletingId === version.id}
						onclick={() => saveVersion(version.id)}
					>
						{savingId === version.id ? 'Salvando…' : `Salvar ${version.label}`}
					</Button>
					{#if canDelete}
						<Button
							type="button"
							variant="destructive"
							size="sm"
							class="min-h-11"
							disabled={deletingId === version.id || savingId === version.id}
							onclick={() => removeVersion(version.id)}
						>
							{deletingId === version.id ? 'Excluindo…' : 'Excluir'}
						</Button>
					{/if}
				</div>
			</div>
		{/if}
	{/each}
</div>
