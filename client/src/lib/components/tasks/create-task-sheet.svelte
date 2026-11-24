<script lang="ts">
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import { Add01Icon } from '@hugeicons/core-free-icons';
	import {
		TASK_PRIORITIES,
		TASK_TYPES,
		TASK_KINDS,
		TASK_PRIORITY_META,
		TASK_TYPE_META,
		TASK_KIND_META
	} from '$lib/tasks/constants';
	import { createTask } from '$lib/tasks/api';
	import { handleMarkdownTextareaKeydown } from '$lib/tasks/markdown-editor';
	import MarkdownToolbar from './markdown-toolbar.svelte';

	type ProjectOption = {
		id: string;
		name: string;
		groupId: string;
		versions: { id: string; label: string; sortOrder: number }[];
	};

	let {
		projects,
		groupMembers,
		open = $bindable(false),
		showTrigger = true,
		initialDueDate = '',
		initialProjectId = ''
	}: {
		projects: ProjectOption[];
		groupMembers: { groupId: string; id: string; name: string | null; email: string }[];
		open?: boolean;
		showTrigger?: boolean;
		/** Prefill prazo when creating from the calendar. */
		initialDueDate?: string;
		/** Prefill projeto (e.g. active filter on /tasks). */
		initialProjectId?: string;
	} = $props();

	let submitting = $state(false);
	let form = $state(emptyForm());
	let descriptionEl = $state<HTMLTextAreaElement | null>(null);

	function defaultVersionId(projectId: string) {
		return projects.find((p) => p.id === projectId)?.versions[0]?.id ?? '';
	}

	function emptyForm(dueDate = '') {
		const projectId =
			(initialProjectId && projects.some((p) => p.id === initialProjectId)
				? initialProjectId
				: projects[0]?.id) ?? '';
		return {
			title: '',
			description: '',
			projectId,
			projectVersionId: defaultVersionId(projectId),
			priority: 'medium',
			type: 'mandatory',
			kind: 'improvement',
			dueDate,
			ownerId: ''
		};
	}

	const selectedProject = $derived(projects.find((p) => p.id === form.projectId));
	const availableVersions = $derived(selectedProject?.versions ?? []);
	const availableOwners = $derived(
		groupMembers.filter((m) => m.groupId === selectedProject?.groupId)
	);

	$effect(() => {
		if (form.ownerId && !availableOwners.some((m) => m.id === form.ownerId)) {
			form.ownerId = '';
		}
	});

	$effect(() => {
		if (
			form.projectVersionId &&
			!availableVersions.some((v) => v.id === form.projectVersionId)
		) {
			form.projectVersionId = availableVersions[0]?.id ?? '';
		}
	});

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		if (!form.title.trim() || !form.projectId || !form.projectVersionId) return;

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

	function handleOpenChange(next: boolean) {
		open = next;
		if (next) form = emptyForm(initialDueDate);
	}
</script>

<Sheet.Root {open} onOpenChange={handleOpenChange}>
	{#if showTrigger}
		<Sheet.Trigger>
			{#snippet child({ props })}
				<Button {...props}>
					<HugeiconsIcon icon={Add01Icon} strokeWidth={2} />
					Criar tarefa
				</Button>
			{/snippet}
		</Sheet.Trigger>
	{/if}
	<Sheet.Content class="flex w-full flex-col overscroll-contain sm:max-w-[24rem]">
		<form onsubmit={handleSubmit} class="flex h-full flex-col">
			<Sheet.Header>
				<Sheet.Title>Nova tarefa</Sheet.Title>
				<Sheet.Description>Cadastre uma demanda para o seu grupo.</Sheet.Description>
			</Sheet.Header>

			<div class="flex flex-1 flex-col gap-md overflow-y-auto px-lg">
				<label class="flex flex-col gap-xxs">
					<span class="font-sans text-ui-label uppercase">Título</span>
					<input class="text-input" name="title" autocomplete="off" bind:value={form.title} required />
				</label>

				<div class="flex flex-col gap-xxs">
					<span class="font-sans text-ui-label uppercase">Descrição</span>
					<div>
						<MarkdownToolbar bind:value={form.description} bind:textareaEl={descriptionEl} />
						<textarea
							bind:this={descriptionEl}
							class="font-mono text-input border-t-0"
							name="description"
							rows="4"
							bind:value={form.description}
							onkeydown={(event) =>
								handleMarkdownTextareaKeydown(
									event,
									form.description,
									(next) => (form.description = next)
								)}
						></textarea>
					</div>
					<span class="font-serif text-caption text-muted-foreground"
						>Aceita Markdown (ToDos, tabelas, código).</span
					>
				</div>

				<label class="flex flex-col gap-xxs">
					<span class="font-sans text-ui-label uppercase">Projeto</span>
					<Select.Root
						type="single"
						bind:value={form.projectId}
						onValueChange={(id) => {
							form.projectVersionId = defaultVersionId(id);
						}}
					>
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
					<span class="font-sans text-ui-label uppercase">Versão</span>
					<Select.Root type="single" bind:value={form.projectVersionId}>
						<Select.Trigger class="w-full">
							{availableVersions.find((v) => v.id === form.projectVersionId)?.label ??
								'Selecione'}
						</Select.Trigger>
						<Select.Content>
							{#each availableVersions as v (v.id)}
								<Select.Item value={v.id} label={v.label} />
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

				<label class="flex flex-col gap-xxs">
					<span class="font-sans text-ui-label uppercase">Classificação</span>
					<Select.Root type="single" bind:value={form.kind}>
						<Select.Trigger class="w-full"
							>{TASK_KIND_META[form.kind as keyof typeof TASK_KIND_META].label}</Select.Trigger
						>
						<Select.Content>
							{#each TASK_KINDS as option (option.value)}
								<Select.Item value={option.value} label={option.label} />
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
					<input type="date" class="text-input" name="dueDate" bind:value={form.dueDate} />
				</label>
			</div>

			<Sheet.Footer>
				<Button
					type="submit"
					disabled={submitting || !form.projectId || !form.projectVersionId}
				>
					{submitting ? 'Criando…' : 'Criar tarefa'}
				</Button>
			</Sheet.Footer>
		</form>
	</Sheet.Content>
</Sheet.Root>
