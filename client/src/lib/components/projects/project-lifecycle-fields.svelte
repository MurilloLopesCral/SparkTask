<script lang="ts">
	import type { ProjectLifecycleForm } from '$lib/projects/lifecycle';

	// Parent sheets may carry extra fields (name, description…); we only bind lifecycle keys.
	let { form = $bindable() }: { form: ProjectLifecycleForm & Record<string, string> } = $props();
</script>

<label class="flex flex-col gap-xxs">
	<span class="font-sans text-ui-label uppercase">ID Plexus</span>
	<input
		class="text-input"
		name="plexusProjectId"
		autocomplete="off"
		spellcheck="false"
		placeholder="Opcional…"
		bind:value={form.plexusProjectId}
	/>
	<span class="font-serif text-caption text-muted-foreground">
		Identificador no Plexus PMI (integração futura).
	</span>
</label>

<fieldset class="flex flex-col gap-sm border border-frame p-sm">
	<legend class="px-xs font-sans text-ui-label uppercase">Implementação</legend>
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
	<legend class="px-xs font-sans text-ui-label uppercase">QO — Operação assistida</legend>
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
	<legend class="px-xs font-sans text-ui-label uppercase">QP — Desempenho</legend>
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
