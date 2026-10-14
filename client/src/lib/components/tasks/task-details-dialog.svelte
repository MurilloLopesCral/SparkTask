<script lang="ts">
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import { toast } from 'svelte-sonner';
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import {
		Edit02Icon,
		Attachment01Icon,
		File02Icon,
		ViewIcon,
		Download01Icon,
		Delete02Icon,
		Copy01Icon,
		Time04Icon
	} from '@hugeicons/core-free-icons';
	import StatusBadge from './status-badge.svelte';
	import KindBadge from './kind-badge.svelte';
	import MarkdownToolbar from './markdown-toolbar.svelte';
	import MarkdownDescription from './markdown-description.svelte';
	import TaskExecutionsDrawer from './task-executions-drawer.svelte';
	import {
		TASK_STATUSES,
		TASK_PRIORITIES,
		TASK_TYPES,
		TASK_KINDS,
		TASK_STATUS_META,
		TASK_PRIORITY_META,
		TASK_TYPE_META,
		TASK_KIND_META
	} from '$lib/tasks/constants';
	import { formatDate, formatFileSize, dueDateStatusClass } from '$lib/tasks/format';
	import { getInitials } from '$lib/users/format';
	import { saveTask, saveTaskDescription, setTaskStatus } from '$lib/tasks/api';
	import { toggleMarkdownTaskAt } from '$lib/tasks/markdown-editor';
	import {
		uploadTaskFile,
		removeTaskFile,
		taskFileDownloadUrl,
		copyTaskImageToClipboard,
		isImageAttachment,
		type FileUploadConfig
	} from '$lib/tasks/files-api';
	import type { VisibleTask } from '$lib/server/tasks';

	let {
		task,
		projects,
		groupMembers,
		fileUploadConfig,
		open = $bindable(false),
		initialEditing = false
	}: {
		task: VisibleTask;
		projects: { id: string; name: string; groupId: string }[];
		groupMembers: { groupId: string; id: string; name: string | null; email: string }[];
		fileUploadConfig: FileUploadConfig;
		open?: boolean;
		initialEditing?: boolean;
	} = $props();

	let editing = $state(false);
	let saving = $state(false);
	let uploading = $state(false);
	let togglingTodo = $state(false);
	let executionsOpen = $state(false);
	let copyingImageId = $state<string | null>(null);
	let form = $state(toFormState(task));
	let viewDescription = $state(task.description ?? '');
	let descriptionEl = $state<HTMLTextAreaElement | null>(null);

	function toFormState(t: VisibleTask) {
		return {
			title: t.title,
			description: t.description ?? '',
			status: t.status as string,
			priority: t.priority as string,
			type: t.type as string,
			kind: t.kind as string,
			dueDate: t.dueDate ?? '',
			ownerId: t.ownerId ?? '',
			projectId: t.projectId
		};
	}

	const selectedProject = $derived(projects.find((p) => p.id === form.projectId));
	const availableOwners = $derived(
		groupMembers.filter((m) => m.groupId === selectedProject?.groupId)
	);
	const projectLabel = $derived(
		editing
			? (selectedProject?.name ?? task.project.name)
			: task.project.name
	);
	const ownerName = $derived(task.owner?.name || task.owner?.email || 'Sem responsável');
	const creatorName = $derived(task.creator.name || task.creator.email);

	// Re-seed the draft and enter/skip edit mode whenever the dialog is (re)opened —
	// keeps a single effect at the open boundary instead of scattering resets
	// across every place that could trigger opening.
	$effect(() => {
		if (open) {
			form = toFormState(task);
			viewDescription = task.description ?? '';
			editing = initialEditing;
		}
	});

	$effect(() => {
		if (!editing && !togglingTodo) {
			viewDescription = task.description ?? '';
		}
	});

	// Selecting a project the current owner doesn't belong to would silently
	// send a stale ownerId — reset it whenever the pool of valid owners changes.
	$effect(() => {
		if (form.ownerId && !availableOwners.some((m) => m.id === form.ownerId)) {
			form.ownerId = '';
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

	async function handleToggleTodo(index: number) {
		if (togglingTodo) return;
		const next = toggleMarkdownTaskAt(viewDescription, index);
		if (next == null) return;

		const previous = viewDescription;
		viewDescription = next;
		togglingTodo = true;
		try {
			const ok = await saveTaskDescription(task.id, next);
			if (!ok) viewDescription = previous;
		} finally {
			togglingTodo = false;
		}
	}

	async function handleCopyImage(attachment: VisibleTask['files'][number]) {
		if (copyingImageId) return;
		copyingImageId = attachment.id;
		try {
			await copyTaskImageToClipboard(attachment.assetUrl);
		} finally {
			copyingImageId = null;
		}
	}

	async function handleCancelTask() {
		await setTaskStatus(task.id, 'cancelled');
		open = false;
	}

	function validateAttachment(file: File): string | null {
		const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
		if (!fileUploadConfig.allowedExtensions.includes(extension)) {
			return `Formato não permitido. Use: ${fileUploadConfig.allowedExtensions.join(', ')}.`;
		}
		if (file.size > fileUploadConfig.maxFileSizeBytes) {
			const maxMb = Math.floor(fileUploadConfig.maxFileSizeBytes / 1024 / 1024);
			return `Arquivo muito grande. Máximo de ${maxMb}MB.`;
		}
		return null;
	}

	async function attachFiles(files: File[]) {
		if (files.length === 0 || uploading) return;

		uploading = true;
		try {
			for (const file of files) {
				const error = validateAttachment(file);
				if (error) {
					toast.error(error);
					continue;
				}
				await uploadTaskFile(task.id, file);
			}
		} finally {
			uploading = false;
		}
	}

	async function handleFileSelect(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const selected = input.files?.[0];
		input.value = '';
		if (!selected) return;
		await attachFiles([selected]);
	}

	function clipboardFiles(data: DataTransfer | null): File[] {
		if (!data) return [];
		const listed = Array.from(data.files ?? []);
		if (listed.length > 0) return listed;

		const fromItems: File[] = [];
		for (const item of Array.from(data.items ?? [])) {
			if (item.kind !== 'file') continue;
			const file = item.getAsFile();
			if (file) fromItems.push(file);
		}
		return fromItems;
	}

	/** Attachment paste only with no field focus, or description focused. */
	function canPasteAttachment(target: EventTarget | null): boolean {
		if (!editing) return false;

		const active = document.activeElement;
		if (descriptionEl && (active === descriptionEl || target === descriptionEl)) return true;

		const focused =
			active instanceof HTMLElement
				? active.closest(
						'input:not([type="file"]), textarea, select, [role="combobox"], [contenteditable="true"]'
					)
				: null;

		if (focused && focused !== descriptionEl) return false;
		return true;
	}

	function handlePaste(event: ClipboardEvent) {
		if (!canPasteAttachment(event.target)) return;

		const files = clipboardFiles(event.clipboardData);
		if (files.length === 0) return;

		// File paste only — never block plain-text paste into the description.
		event.preventDefault();
		void attachFiles(files);
	}
</script>

<AlertDialog.Root bind:open>
	<AlertDialog.Content
		interactOutsideBehavior="close"
		class="max-h-[min(90dvh,100%)] w-[calc(100%-1.5rem)] max-w-[32rem] overflow-y-auto overscroll-contain sm:w-full"
		onpaste={handlePaste}
	>
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
				<div class="flex flex-wrap items-center gap-xs">
					<AlertDialog.Description class="m-0">{projectLabel}</AlertDialog.Description>
					{#if !editing}
						<KindBadge kind={task.kind} />
					{/if}
				</div>
			</div>
			{#if !editing}
				<div class="flex shrink-0 items-center gap-xxs">
					<Tooltip.Root>
						<Tooltip.Trigger>
							{#snippet child({ props })}
								<button
									{...props}
									type="button"
									class="grid size-8 place-items-center"
									onclick={() => (executionsOpen = true)}
								>
									<HugeiconsIcon icon={Time04Icon} strokeWidth={2} />
									<span class="sr-only">Ver execuções</span>
								</button>
							{/snippet}
						</Tooltip.Trigger>
						<Tooltip.Content>Execuções</Tooltip.Content>
					</Tooltip.Root>
					<Tooltip.Root>
						<Tooltip.Trigger>
							{#snippet child({ props })}
								<button
									{...props}
									type="button"
									class="grid size-8 place-items-center"
									onclick={() => (editing = true)}
								>
									<HugeiconsIcon icon={Edit02Icon} strokeWidth={2} />
									<span class="sr-only">Editar tarefa</span>
								</button>
							{/snippet}
						</Tooltip.Trigger>
						<Tooltip.Content>Editar tarefa</Tooltip.Content>
					</Tooltip.Root>
				</div>
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

				<Select.Root type="single" bind:value={form.kind}>
					<Select.Trigger
						>{TASK_KIND_META[form.kind as keyof typeof TASK_KIND_META].label}</Select.Trigger
					>
					<Select.Content>
						{#each TASK_KINDS as option (option.value)}
							<Select.Item value={option.value} label={option.label} />
						{/each}
					</Select.Content>
				</Select.Root>
			</div>

			<label class="flex flex-col gap-xxs">
				<span class="font-sans text-ui-label uppercase">Projeto</span>
				<Select.Root type="single" bind:value={form.projectId}>
					<Select.Trigger class="w-full">
						{selectedProject?.name ?? 'Selecione um projeto'}
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

			<div class="flex flex-col gap-xxs">
				<span class="font-sans text-ui-label uppercase">Descrição</span>
				<div>
					<MarkdownToolbar bind:value={form.description} bind:textareaEl={descriptionEl} />
					<textarea
						bind:this={descriptionEl}
						class="font-mono text-input border-t-0"
						rows="5"
						bind:value={form.description}
					></textarea>
				</div>
				<span class="font-serif text-caption text-muted-foreground">
					Aceita Markdown, inclusive ToDos (- [ ]). Ctrl+V (⌘V) cola anexos aqui ou com o diálogo
					focado.
				</span>
			</div>

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

			{#if viewDescription}
				<div class="markdown-body font-serif text-body">
					<MarkdownDescription
						source={viewDescription}
						interactive
						ontoggle={handleToggleTodo}
					/>
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
				<p class="font-serif text-caption text-muted-foreground">
					Nenhum arquivo anexado.{#if editing}
						Cole um arquivo com Ctrl+V.
					{/if}
				</p>
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
							{#if isImageAttachment(attachment)}
								<Tooltip.Root>
									<Tooltip.Trigger>
										{#snippet child({ props })}
											<button
												{...props}
												type="button"
												class="grid size-6 shrink-0 cursor-pointer place-items-center disabled:opacity-40"
												disabled={copyingImageId === attachment.id}
												onclick={() => handleCopyImage(attachment)}
											>
												<HugeiconsIcon icon={Copy01Icon} strokeWidth={2} />
												<span class="sr-only">Copiar imagem</span>
											</button>
										{/snippet}
									</Tooltip.Trigger>
									<Tooltip.Content>Copiar imagem</Tooltip.Content>
								</Tooltip.Root>
							{/if}
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

<TaskExecutionsDrawer bind:open={executionsOpen} taskId={task.id} taskTitle={task.title} />
