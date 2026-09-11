<script lang="ts">
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import { Add01Icon } from '@hugeicons/core-free-icons';
	import {
		TASK_PRIORITIES,
		TASK_TYPES,
		TASK_PRIORITY_META,
		TASK_TYPE_META
	} from '$lib/tasks/constants';
	import { createTask } from '$lib/tasks/api';
	import MarkdownToolbar from './markdown-toolbar.svelte';

	let {
		projects,
		groupMembers
	}: {
		projects: { id: string; name: string; groupId: string }[];
		groupMembers: { groupId: string; id: string; name: string | null; email: string }[];
	} = $props();

	let open = $state(false);
	let submitting = $state(false);
	let form = $state(emptyForm());
	let descriptionEl = $state<HTMLTextAreaElement | null>(null);

	function emptyForm() {
		return {
			title: '',
			description: '',
			projectId: projects[0]?.id ?? '',
			priority: 'medium',
			type: 'mandatory',
			dueDate: '',
			ownerId: ''
		};
	}

	const selectedProject = $derived(projects.find((p) => p.id === form.projectId));
	const availableOwners = $derived(
		groupMembers.filter((m) => m.groupId === selectedProject?.groupId)
	);

	// Selecting a project the current owner doesn't belong to would silently
	// send a stale ownerId — reset it whenever the pool of valid owners changes.
	$effect(() => {
		if (form.ownerId && !availableOwners.some((m) => m.id === form.ownerId)) {
			form.ownerId = '';
		}
	});

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		if (!form.title.trim() || !form.projectId) return;

		submitting = true;
		try {
			const res = await createTask(form);
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
				Criar tarefa
			</Button>
		{/snippet}
	</Sheet.Trigger>
	<Sheet.Content class="flex w-full flex-col sm:max-w-[24rem]">
		<form onsubmit={handleSubmit} class="flex h-full flex-col">
			<Sheet.Header>
				<Sheet.Title>Nova tarefa</Sheet.Title>
				<Sheet.Description>Cadastre uma demanda para o seu grupo.</Sheet.Description>
			</Sheet.Header>

			<div class="flex flex-1 flex-col gap-md overflow-y-auto px-lg">
				<label class="flex flex-col gap-xxs">
					<span class="font-sans text-ui-label uppercase">Título</span>
					<input class="text-input" bind:value={form.title} required />
				</label>

				<div class="flex flex-col gap-xxs">
					<span class="font-sans text-ui-label uppercase">Descrição</span>
					<div>
						<MarkdownToolbar bind:value={form.description} bind:textareaEl={descriptionEl} />
						<textarea
							bind:this={descriptionEl}
							class="text-input border-t-0"
							rows="4"
							bind:value={form.description}
						></textarea>
					</div>
					<span class="font-serif text-caption text-muted-foreground">Aceita Markdown.</span>
				</div>

				<label class="flex flex-col gap-xxs">
					<span class="font-sans text-ui-label uppercase">Projeto</span>
					<Select.Root type="single" bind:value={form.projectId}>
						<Select.Trigger class="w-full">
							{projects.find((p) => p.id === form.projectId)?.name ?? 'Selecione um projeto'}
						</Select.Trigger>
						<Select.Content>
							{#each projects as p (p.id)}
								<Select.Item value={p.id} label={p.name} />
							{/each}
						</Select.Content>
					</Select.Root>
				</label>

				<label class="flex flex-col gap-xxs">
					<span class="font-sans text-ui-label uppercase">Responsável</span>
					<Select.Root type="single" bind:value={form.ownerId}>
						<Select.Trigger class="w-full">
							{availableOwners.find((m) => m.id === form.ownerId)?.name ||
								availableOwners.find((m) => m.id === form.ownerId)?.email ||
								'Sem responsável'}
						</Select.Trigger>
						<Select.Content>
							<Select.Item value="" label="Sem responsável" />
							{#each availableOwners as m (m.id)}
								<Select.Item value={m.id} label={m.name || m.email} />
							{/each}
						</Select.Content>
					</Select.Root>
				</label>

				<div class="flex gap-sm">
					<label class="flex flex-1 flex-col gap-xxs">
						<span class="font-sans text-ui-label uppercase">Prioridade</span>
						<Select.Root type="single" bind:value={form.priority}>
							<Select.Trigger class="w-full"
								>{TASK_PRIORITY_META[form.priority as keyof typeof TASK_PRIORITY_META]
									.label}</Select.Trigger
							>
							<Select.Content>
								{#each TASK_PRIORITIES as option (option.value)}
									<Select.Item value={option.value} label={option.label} />
								{/each}
							</Select.Content>
						</Select.Root>
					</label>

					<label class="flex flex-1 flex-col gap-xxs">
						<span class="font-sans text-ui-label uppercase">Tipo</span>
						<Select.Root type="single" bind:value={form.type}>
							<Select.Trigger class="w-full"
								>{TASK_TYPE_META[form.type as keyof typeof TASK_TYPE_META].label}</Select.Trigger
							>
							<Select.Content>
								{#each TASK_TYPES as option (option.value)}
									<Select.Item value={option.value} label={option.label} />
								{/each}
							</Select.Content>
						</Select.Root>
					</label>
				</div>

				<label class="flex flex-col gap-xxs">
					<span class="font-sans text-ui-label uppercase">Prazo</span>
					<input type="date" class="text-input" bind:value={form.dueDate} />
				</label>
			</div>

			<Sheet.Footer>
				<Button type="submit" disabled={submitting || !form.projectId}>
					{submitting ? 'Criando…' : 'Criar tarefa'}
				</Button>
			</Sheet.Footer>
		</form>
	</Sheet.Content>
</Sheet.Root>
