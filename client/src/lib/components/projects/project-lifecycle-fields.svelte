<script lang="ts">
	import type { ProjectPlexusForm, VersionPhaseForm } from '$lib/projects/lifecycle';

	let {
		form = $bindable(),
		showPhases = true
	}: {
		form: ProjectPlexusForm & Partial<VersionPhaseForm> & Record<string, string>;
		/** Create sheet seeds V1; edit sheet manages phases per version. */
		showPhases?: boolean;
	} = $props();
</script>

<fieldset class="flex flex-col gap-sm border border-frame p-sm">
	<legend class="px-xs font-sans text-ui-label uppercase">Integração Plexus</legend>

	<label class="flex flex-col gap-xxs">
		<span class="font-serif text-caption text-muted-foreground">ID do projeto (scopeId)</span>
		<input
			class="text-input"
			name="plexusProjectId"
			inputmode="numeric"
			autocomplete="off"
			spellcheck="false"
			placeholder="Ex.: 12"
			bind:value={form.plexusProjectId}
		/>
	</label>

	<label class="flex flex-col gap-xxs">
		<span class="font-serif text-caption text-muted-foreground"
			>Código da task de execução (topicCode)</span
		>
		<input
			class="text-input"
			name="plexusTopicCode"
			autocomplete="off"
			spellcheck="false"
			placeholder="Ex.: 1.1"
			bind:value={form.plexusTopicCode}
		/>
	</label>

	<p class="font-serif text-caption text-muted-foreground">
		Com ambos preenchidos, tarefas de versões com “Integra Plexus” ativo viram itens de Gantt na
		task Plexus correspondente.
	</p>
</fieldset>

{#if showPhases}
	<fieldset class="flex flex-col gap-sm border border-frame p-sm">
		<legend class="px-xs font-sans text-ui-label uppercase">V1 — Implementação</legend>
		<div class="grid grid-cols-2 gap-sm">
			<label class="flex flex-col gap-xxs">
				<span class="font-serif text-caption text-muted-foreground">Início</span>
				<input
					class="text-input"
					type="date"
					name="implementationStart"
					bind:value={form.implementationStart}
				/>
			</label>
			<label class="flex flex-col gap-xxs">
				<span class="font-serif text-caption text-muted-foreground">Fim</span>
				<input
					class="text-input"
					type="date"
					name="implementationEnd"
					bind:value={form.implementationEnd}
				/>
			</label>
		</div>
	</fieldset>

	<fieldset class="flex flex-col gap-sm border border-frame p-sm">
		<legend class="px-xs font-sans text-ui-label uppercase">V1 — QO</legend>
		<div class="grid grid-cols-2 gap-sm">
			<label class="flex flex-col gap-xxs">
				<span class="font-serif text-caption text-muted-foreground">Início</span>
				<input
					class="text-input"
					type="date"
					name="assistedOpsStart"
					bind:value={form.assistedOpsStart}
				/>
			</label>
			<label class="flex flex-col gap-xxs">
				<span class="font-serif text-caption text-muted-foreground">Fim</span>
				<input
					class="text-input"
					type="date"
					name="assistedOpsEnd"
					bind:value={form.assistedOpsEnd}
				/>
			</label>
		</div>
	</fieldset>

	<fieldset class="flex flex-col gap-sm border border-frame p-sm">
		<legend class="px-xs font-sans text-ui-label uppercase">V1 — QP</legend>
		<div class="grid grid-cols-2 gap-sm">
			<label class="flex flex-col gap-xxs">
				<span class="font-serif text-caption text-muted-foreground">Início</span>
				<input
					class="text-input"
					type="date"
					name="performanceStart"
					bind:value={form.performanceStart}
				/>
			</label>
			<label class="flex flex-col gap-xxs">
				<span class="font-serif text-caption text-muted-foreground">Fim</span>
				<input
					class="text-input"
					type="date"
					name="performanceEnd"
					bind:value={form.performanceEnd}
				/>
			</label>
		</div>
	</fieldset>
{/if}
