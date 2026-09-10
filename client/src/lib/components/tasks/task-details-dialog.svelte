<script lang="ts">
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import SvelteMarkdown from 'svelte-markdown';
	import { toast } from 'svelte-sonner';
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import {
		Edit02Icon,
		Attachment01Icon,
		File02Icon,
		ViewIcon,
		Download01Icon,
		Delete02Icon
	} from '@hugeicons/core-free-icons';
	import StatusBadge from './status-badge.svelte';
	import {
		TASK_STATUSES,
		TASK_PRIORITIES,
		TASK_TYPES,
		TASK_STATUS_META,
		TASK_PRIORITY_META,
		TASK_TYPE_META
	} from '$lib/tasks/constants';
	import { formatDate, formatFileSize, dueDateStatusClass } from '$lib/tasks/format';
	import { getInitials } from '$lib/users/format';
	import { saveTask, setTaskStatus } from '$lib/tasks/api';
	import {
		uploadTaskFile,
		removeTaskFile,
		taskFileDownloadUrl,
		type FileUploadConfig
	} from '$lib/tasks/files-api';
	import type { VisibleTask } from '$lib/server/tasks';

	let {
		task,
		groupMembers,
		fileUploadConfig,
		open = $bindable(false),
		initialEditing = false
	}: {
		task: VisibleTask;
		groupMembers: { groupId: string; id: string; name: string | null; email: string }[];
		fileUploadConfig: FileUploadConfig;
		open?: boolean;
		initialEditing?: boolean;
	} = $props();

	let editing = $state(false);
	let saving = $state(false);
	let uploading = $state(false);
	let form = $state(toFormState(task));

	function toFormState(t: VisibleTask) {
		return {
			title: t.title,
			description: t.description ?? '',
			status: t.status as string,
			priority: t.priority as string,
			type: t.type as string,
			dueDate: t.dueDate ?? '',
			ownerId: t.ownerId ?? ''
		};
	}

	const availableOwners = $derived(groupMembers.filter((m) => m.groupId === task.project.groupId));
	const ownerName = $derived(task.owner?.name || task.owner?.email || 'Sem responsável');
	const creatorName = $derived(task.creator.name || task.creator.email);

	// Re-seed the draft and enter/skip edit mode whenever the dialog is (re)opened —
	// keeps a single effect at the open boundary instead of scattering resets
	// across every place that could trigger opening.
	$effect(() => {
		if (open) {
			form = toFormState(task);
			editing = initialEditing;
		}
	});

	async function handleSave() {
		saving = true;
		try {
			if (await saveTask(task.id, form)) editing = false;
		} finally {
			saving = false;
		}
	}

	function handleDiscard() {
		form = toFormState(task);
		editing = false;
	}

	async function handleCancelTask() {
		await setTaskStatus(task.id, 'cancelled');
		open = false;
	}

	async function handleFileSelect(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const selected = input.files?.[0];
		input.value = '';
		if (!selected) return;

		const extension = selected.name.split('.').pop()?.toLowerCase() ?? '';
		if (!fileUploadConfig.allowedExtensions.includes(extension)) {
			toast.error(`Formato não permitido. Use: ${fileUploadConfig.allowedExtensions.join(', ')}.`);
			return;
		}
		if (selected.size > fileUploadConfig.maxFileSizeBytes) {
			const maxMb = Math.floor(fileUploadConfig.maxFileSizeBytes / 1024 / 1024);
			toast.error(`Arquivo muito grande. Máximo de ${maxMb}MB.`);
			return;
		}

		uploading = true;
		try {
			await uploadTaskFile(task.id, selected);
		} finally {
			uploading = false;
		}
	}
</script>

<AlertDialog.Root bind:open>
	<AlertDialog.Content interactOutsideBehavior="close" class="max-w-[32rem]">
		<AlertDialog.Header class="flex w-full flex-row items-start justify-between">
			<div class="flex-1">
				{#if editing}
					<input
						class="font-display text-h3 text-input uppercase"
						bind:value={form.title}
						aria-label="Título da tarefa"
					/>
				{:else}
					<AlertDialog.Title>{task.title}</AlertDialog.Title>
				{/if}
				<AlertDialog.Description>{task.project.name}</AlertDialog.Description>
			</div>
			{#if !editing}
				<button
					type="button"
					class="grid size-8 shrink-0 place-items-center"
					onclick={() => (editing = true)}
				>
					<HugeiconsIcon icon={Edit02Icon} strokeWidth={2} />
					<span class="sr-only">Editar tarefa</span>
				</button>
			{/if}
		</AlertDialog.Header>

		{#if editing}
			<div class="flex flex-wrap gap-sm">
				<Select.Root type="single" bind:value={form.status}>
					<Select.Trigger
						>{TASK_STATUS_META[form.status as keyof typeof TASK_STATUS_META].label}</Select.Trigger
					>
					<Select.Content>
						{#each TASK_STATUSES as option (option.value)}
							<Select.Item value={option.value} label={option.label} />
						{/each}
					</Select.Content>
				</Select.Root>

				<Select.Root type="single" bind:value={form.priority}>
					<Select.Trigger
						>{TASK_PRIORITY_META[form.priority as keyof typeof TASK_PRIORITY_META]
							.label}</Select.Trigger
					>
					<Select.Content>
						{#each TASK_PRIORITIES as option (option.value)}
							<Select.Item value={option.value} label={option.label} />
						{/each}
					</Select.Content>
				</Select.Root>

				<Select.Root type="single" bind:value={form.type}>
					<Select.Trigger
						>{TASK_TYPE_META[form.type as keyof typeof TASK_TYPE_META].label}</Select.Trigger
					>
					<Select.Content>
						{#each TASK_TYPES as option (option.value)}
							<Select.Item value={option.value} label={option.label} />
						{/each}
					</Select.Content>
				</Select.Root>
			</div>

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
				<span class="font-sans text-ui-label uppercase">Descrição</span>
				<textarea class="font-mono text-input" rows="5" bind:value={form.description}></textarea>
				<span class="font-serif text-caption text-muted-foreground">Aceita Markdown.</span>
			</label>

			<label class="flex flex-col gap-xxs">
				<span class="font-sans text-ui-label uppercase">Prazo</span>
				<input type="date" class="text-input" bind:value={form.dueDate} />
			</label>
		{:else}
			<div class="flex flex-wrap items-center gap-xs">
				<StatusBadge status={task.status} />
				<span class="font-serif text-caption text-muted-foreground">
					{TASK_PRIORITY_META[task.priority].label} · {TASK_TYPE_META[task.type].label}
				</span>
			</div>

			{#if task.description}
				<div class="markdown-body font-serif text-body">
					<SvelteMarkdown source={task.description} />
				</div>
			{/if}
		{/if}

		<dl
			class="grid grid-cols-2 gap-x-lg gap-y-xs border-t border-frame pt-md font-serif text-body-sm"
		>
			<dt class="text-muted-foreground">Responsável</dt>
			<dd class="flex items-center gap-xs">
				<Avatar.Root size="sm" class="size-6">
					<Avatar.Image src={task.owner?.image} alt={ownerName} />
					<Avatar.Fallback class="text-[10px]">
						{task.owner ? getInitials(task.owner.name, task.owner.email) : '—'}
					</Avatar.Fallback>
				</Avatar.Root>
				{ownerName}
			</dd>

			<dt class="text-muted-foreground">Criado por</dt>
			<dd class="flex items-center gap-xs">
				<Avatar.Root size="sm" class="size-6">
					<Avatar.Image src={task.creator.image} alt={creatorName} />
					<Avatar.Fallback class="text-[10px]">
						{getInitials(task.creator.name, task.creator.email)}
					</Avatar.Fallback>
				</Avatar.Root>
				{creatorName}
			</dd>

			{#if !editing}
				<dt class="text-muted-foreground">Prazo</dt>
				<dd class="font-medium {dueDateStatusClass(task.dueDate)}">
					{formatDate(task.dueDate) ?? '—'}
				</dd>
			{/if}

			<dt class="text-muted-foreground">Criada em</dt>
			<dd>{formatDate(task.createdAt) ?? '—'}</dd>
		</dl>

		<div class="flex flex-col gap-sm border-t border-frame pt-md">
			<div class="flex items-center justify-between">
				<span class="font-sans text-ui-label uppercase">Anexos</span>
				<label class="btn-secondary {uploading ? 'pointer-events-none opacity-40' : ''}">
					<HugeiconsIcon icon={Attachment01Icon} strokeWidth={2} />
					{uploading ? 'Enviando…' : 'Anexar arquivo'}
					<input type="file" class="hidden" onchange={handleFileSelect} disabled={uploading} />
				</label>
			</div>

			{#if task.files.length === 0}
				<p class="font-serif text-caption text-muted-foreground">Nenhum arquivo anexado.</p>
			{:else}
				<ul class="flex flex-col gap-xs">
					{#each task.files as attachment (attachment.id)}
						<li class="flex items-center gap-sm border border-frame bg-canvas px-sm py-xs">
							<div class="flex flex-1 items-center gap-xs overflow-hidden font-serif text-body-sm">
								<HugeiconsIcon icon={File02Icon} strokeWidth={2} class="size-4 shrink-0" />
								<span class="truncate">{attachment.name}</span>
							</div>
							<span class="shrink-0 font-serif text-caption text-muted-foreground">
								{formatFileSize(attachment.size)}
							</span>
							<Tooltip.Root>
								<Tooltip.Trigger>
									{#snippet child({ props })}
										<a
											{...props}
											href={attachment.assetUrl}
											target="_blank"
											rel="external noopener noreferrer"
											class="grid size-6 shrink-0 place-items-center"
										>
											<HugeiconsIcon icon={ViewIcon} strokeWidth={2} />
											<span class="sr-only">Visualizar arquivo</span>
										</a>
									{/snippet}
								</Tooltip.Trigger>
								<Tooltip.Content>Visualizar arquivo</Tooltip.Content>
							</Tooltip.Root>
							<Tooltip.Root>
								<Tooltip.Trigger>
									{#snippet child({ props })}
										<a
											{...props}
											href={taskFileDownloadUrl(attachment.assetUrl)}
											download={attachment.name}
											rel="external"
											class="grid size-6 shrink-0 place-items-center"
										>
											<HugeiconsIcon icon={Download01Icon} strokeWidth={2} />
											<span class="sr-only">Baixar arquivo</span>
										</a>
									{/snippet}
								</Tooltip.Trigger>
								<Tooltip.Content>Baixar arquivo</Tooltip.Content>
							</Tooltip.Root>
							<Tooltip.Root>
								<Tooltip.Trigger>
									{#snippet child({ props })}
										<button
											{...props}
											type="button"
											class="grid size-6 shrink-0 cursor-pointer place-items-center"
											onclick={() => removeTaskFile(attachment.id)}
										>
											<HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
											<span class="sr-only">Excluir arquivo</span>
										</button>
									{/snippet}
								</Tooltip.Trigger>
								<Tooltip.Content>Excluir arquivo</Tooltip.Content>
							</Tooltip.Root>
						</li>
					{/each}
				</ul>
			{/if}
		</div>

		<AlertDialog.Footer>
			{#if editing}
				<button type="button" class="btn-secondary" onclick={handleDiscard}>Descartar</button>
				<button type="button" class="btn-primary" onclick={handleSave} disabled={saving}>
					{saving ? 'Salvando…' : 'Salvar'}
				</button>
			{:else}
				<button type="button" class="btn-secondary" onclick={handleCancelTask}
					>Cancelar tarefa</button
				>
				<AlertDialog.Cancel>Fechar</AlertDialog.Cancel>
			{/if}
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
