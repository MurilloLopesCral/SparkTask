<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import { Camera01Icon, Delete02Icon } from '@hugeicons/core-free-icons';
	import ProjectIcon from './project-icon.svelte';

	let {
		imageUrl = $bindable<string | null>(null),
		pendingFile = $bindable<File | null>(null),
		cleared = $bindable(false),
		projectName = 'Projeto'
	}: {
		imageUrl?: string | null;
		pendingFile?: File | null;
		/** True when the user removed an existing image and did not pick a new one. */
		cleared?: boolean;
		projectName?: string;
	} = $props();

	let previewUrl = $state<string | null>(null);

	$effect(() => {
		if (pendingFile) {
			const url = URL.createObjectURL(pendingFile);
			previewUrl = url;
			return () => URL.revokeObjectURL(url);
		}
		previewUrl = null;
	});

	const displaySrc = $derived(previewUrl ?? (cleared ? null : imageUrl));

	function handleSelect(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const selected = input.files?.[0] ?? null;
		input.value = '';
		if (!selected) return;
		pendingFile = selected;
		cleared = false;
	}

	function handleClear() {
		pendingFile = null;
		cleared = true;
	}
</script>

<div class="flex flex-col gap-xs">
	<span class="font-sans text-ui-label uppercase" id="project-image-label">Imagem</span>
	<p class="font-serif text-caption text-muted-foreground">
		PNG, JPG, WebP ou GIF · máx. 5 MB. Aparece como ícone nas tarefas e no status report.
	</p>

	<div class="flex items-center gap-md">
		<div
			class="grid size-16 shrink-0 place-items-center border-2 border-frame bg-muted"
			aria-labelledby="project-image-label"
		>
			{#if displaySrc}
				<ProjectIcon src={displaySrc} alt={`Ícone de ${projectName}`} size="lg" loading="eager" />
			{:else}
				<span class="font-sans text-ui-label uppercase text-muted-foreground">—</span>
			{/if}
		</div>

		<div class="flex min-w-0 flex-wrap gap-xs">
			<label class="btn-secondary inline-flex min-h-11 cursor-pointer items-center gap-xs px-sm">
				<HugeiconsIcon icon={Camera01Icon} strokeWidth={2} class="size-4" aria-hidden="true" />
				{displaySrc ? 'Trocar' : 'Escolher'}
				<input
					type="file"
					accept="image/png,image/jpeg,image/webp,image/gif,.png,.jpg,.jpeg,.webp,.gif"
					name="projectImage"
					autocomplete="off"
					class="sr-only"
					onchange={handleSelect}
				/>
			</label>
			{#if displaySrc}
				<Button type="button" variant="outline" class="min-h-11" onclick={handleClear}>
					<HugeiconsIcon icon={Delete02Icon} strokeWidth={2} data-icon="inline-start" />
					Remover
				</Button>
			{/if}
		</div>
	</div>
</div>
