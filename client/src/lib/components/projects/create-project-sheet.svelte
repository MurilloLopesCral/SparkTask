<script lang="ts">
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import { Add01Icon } from '@hugeicons/core-free-icons';
	import { createProject } from '$lib/projects/api';

	let { groups }: { groups: { id: string; name: string }[] } = $props();

	let open = $state(false);
	let submitting = $state(false);
	let form = $state(emptyForm());

	function emptyForm() {
		return {
			name: '',
			description: '',
			groupId: groups[0]?.id ?? ''
		};
	}

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		if (!form.name.trim() || !form.groupId) return;

		submitting = true;
		try {
			const res = await createProject(form);
			if (res.ok) {
				open = false;
				form = emptyForm();
			}
		} finally {
			submitting = false;
		}
	}
</script>

<Sheet.Root bind:open>
	<Sheet.Trigger>
		{#snippet child({ props })}
			<Button {...props}>
				<HugeiconsIcon icon={Add01Icon} strokeWidth={2} />
				Criar projeto
			</Button>
		{/snippet}
	</Sheet.Trigger>
	<Sheet.Content class="flex w-full flex-col sm:max-w-[24rem]">
		<form onsubmit={handleSubmit} class="flex h-full flex-col">
			<Sheet.Header>
				<Sheet.Title>Novo projeto</Sheet.Title>
				<Sheet.Description>Cadastre um projeto para o seu grupo.</Sheet.Description>
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

				<label class="flex flex-col gap-xxs">
					<span class="font-sans text-ui-label uppercase">Grupo</span>
					<Select.Root type="single" bind:value={form.groupId}>
						<Select.Trigger class="w-full">
							{groups.find((g) => g.id === form.groupId)?.name ?? 'Selecione um grupo'}
						</Select.Trigger>
						<Select.Content>
							{#each groups as g (g.id)}
								<Select.Item value={g.id} label={g.name} />
							{/each}
						</Select.Content>
					</Select.Root>
				</label>
			</div>

			<Sheet.Footer>
				<Button type="submit" disabled={submitting || !form.groupId}>
					{submitting ? 'Criando…' : 'Criar projeto'}
				</Button>
			</Sheet.Footer>
		</form>
	</Sheet.Content>
</Sheet.Root>
