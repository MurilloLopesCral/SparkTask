<script lang="ts">
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import {
		TASK_PRIORITIES,
		TASK_TYPES,
		TASK_KINDS,
		TASK_PRIORITY_META,
		TASK_TYPE_META,
		TASK_KIND_META
	} from '$lib/tasks/constants';
	import {
		RECURRENCE_FREQUENCIES,
		WEEKDAY_OPTIONS,
		type RecurrenceFrequency
	} from '$lib/recurrence/constants';
	import { createRecurrence, updateRecurrence, type RecurrenceFormValues } from '$lib/recurrence/api';

	type Project = { id: string; name: string; groupId: string };
	type Member = { groupId: string; id: string; name: string | null; email: string };
	type Existing = {
		id: string;
		title: string;
		description: string | null;
		projectId: string;
		priority: string;
		type: string;
		kind: string;
		ownerId: string | null;
		frequency: RecurrenceFrequency;
		weekdaysOnly: boolean;
		weekDays: number[] | null;
		dayOfMonth: number | null;
		nextDueDate: string;
		enabled: boolean;
	};

	let {
		projects,
		groupMembers,
		editing = $bindable(null as Existing | null),
		open = $bindable(false),
		initialStartFrom = ''
	}: {
		projects: Project[];
		groupMembers: Member[];
		editing?: Existing | null;
		open?: boolean;
		/** Prefill "A partir de" when creating from the calendar. */
		initialStartFrom?: string;
	} = $props();

	let submitting = $state(false);
	let form = $state(emptyForm());

	function emptyForm(startFrom = ''): RecurrenceFormValues {
		return {
			projectId: projects[0]?.id ?? '',
			title: '',
			description: '',
			priority: 'medium',
			type: 'mandatory',
			kind: 'improvement',
			ownerId: '',
			frequency: 'weekly',
			weekdaysOnly: false,
			weekDays: [1, 2, 3, 4, 5],
			dayOfMonth: 1,
			startFrom
		};
	}

	$effect(() => {
		if (!open) return;
		if (editing) {
			form = {
				projectId: editing.projectId,
				title: editing.title,
				description: editing.description ?? '',
				priority: editing.priority,
				type: editing.type,
				kind: editing.kind,
				ownerId: editing.ownerId ?? '',
				frequency: editing.frequency,
				weekdaysOnly: editing.weekdaysOnly,
				weekDays: editing.weekDays?.length ? [...editing.weekDays] : [1],
				dayOfMonth: editing.dayOfMonth ?? 1,
				startFrom: editing.nextDueDate,
				enabled: editing.enabled
			};
		} else {
			form = emptyForm(initialStartFrom);
		}
	});

	const selectedProject = $derived(projects.find((p) => p.id === form.projectId));
	const availableOwners = $derived(
		groupMembers.filter((m) => m.groupId === selectedProject?.groupId)
	);

	$effect(() => {
		if (form.ownerId && !availableOwners.some((m) => m.id === form.ownerId)) {
			form.ownerId = '';
		}
	});

	function toggleWeekDay(day: number) {
		if (form.weekDays.includes(day)) {
			form.weekDays = form.weekDays.filter((d) => d !== day);
		} else {
			form.weekDays = [...form.weekDays, day].sort((a, b) => a - b);
		}
	}

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		if (!form.title.trim() || !form.projectId) return;
		submitting = true;
		try {
			const ok = editing
				? await updateRecurrence(editing.id, form)
				: await createRecurrence(form);
			if (ok) {
				open = false;
				editing = null;
			}
		} finally {
			submitting = false;
		}
	}

	function handleOpenChange(next: boolean) {
		open = next;
		if (!next) editing = null;
	}
</script>

<Sheet.Root {open} onOpenChange={handleOpenChange}>
	<Sheet.Content class="flex w-full flex-col overscroll-contain sm:max-w-[24rem]">
		<form onsubmit={handleSubmit} class="flex h-full flex-col">
			<Sheet.Header>
				<Sheet.Title>{editing ? 'Editar recorrência' : 'Nova recorrência'}</Sheet.Title>
				<Sheet.Description>
					{#if editing}
						Alterações afetam apenas ocorrências futuras.
					{:else}
						Modelo que gera tarefas automaticamente nas datas combinadas.
					{/if}
				</Sheet.Description>
			</Sheet.Header>

			<div class="flex flex-1 flex-col gap-md overflow-y-auto px-lg">
				<label class="flex flex-col gap-xxs">
					<span class="font-sans text-ui-label uppercase">Título</span>
					<input
						class="text-input"
						name="title"
						autocomplete="off"
						bind:value={form.title}
						required
					/>
				</label>

				<label class="flex flex-col gap-xxs">
					<span class="font-sans text-ui-label uppercase">Descrição</span>
					<textarea
						class="text-input font-mono"
						name="description"
						rows="3"
						bind:value={form.description}
						placeholder="Opcional…"
					></textarea>
				</label>

				<label class="flex flex-col gap-xxs">
					<span class="font-sans text-ui-label uppercase">Projeto</span>
					<select class="text-input" name="projectId" bind:value={form.projectId} required>
						{#each projects as project (project.id)}
							<option value={project.id}>{project.name}</option>
						{/each}
					</select>
				</label>

				<div class="grid grid-cols-2 gap-sm">
					<label class="flex flex-col gap-xxs">
						<span class="font-sans text-ui-label uppercase">Prioridade</span>
						<select class="text-input" name="priority" bind:value={form.priority}>
							{#each TASK_PRIORITIES as p (p.value)}
								<option value={p.value}>{TASK_PRIORITY_META[p.value].label}</option>
							{/each}
						</select>
					</label>
					<label class="flex flex-col gap-xxs">
						<span class="font-sans text-ui-label uppercase">Tipo</span>
						<select class="text-input" name="type" bind:value={form.type}>
							{#each TASK_TYPES as t (t.value)}
								<option value={t.value}>{TASK_TYPE_META[t.value].label}</option>
							{/each}
						</select>
					</label>
				</div>

				<label class="flex flex-col gap-xxs">
					<span class="font-sans text-ui-label uppercase">Natureza</span>
					<select class="text-input" name="kind" bind:value={form.kind}>
						{#each TASK_KINDS as k (k.value)}
							<option value={k.value}>{TASK_KIND_META[k.value].label}</option>
						{/each}
					</select>
				</label>

				<label class="flex flex-col gap-xxs">
					<span class="font-sans text-ui-label uppercase">Responsável</span>
					<select class="text-input" name="ownerId" bind:value={form.ownerId}>
						<option value="">Sem responsável</option>
						{#each availableOwners as member (member.id)}
							<option value={member.id}>{member.name || member.email}</option>
						{/each}
					</select>
				</label>

				<label class="flex flex-col gap-xxs">
					<span class="font-sans text-ui-label uppercase">Frequência</span>
					<select class="text-input" name="frequency" bind:value={form.frequency}>
						{#each RECURRENCE_FREQUENCIES as f (f.value)}
							<option value={f.value}>{f.label}</option>
						{/each}
					</select>
				</label>

				{#if form.frequency === 'daily'}
					<label class="flex min-h-11 cursor-pointer items-center gap-sm touch-manipulation">
						<input type="checkbox" bind:checked={form.weekdaysOnly} class="size-4" />
						<span class="font-serif text-body">Somente dias úteis (seg–sex)</span>
					</label>
				{/if}

				{#if form.frequency === 'weekly'}
					<fieldset class="flex flex-col gap-xs">
						<legend class="font-sans text-ui-label uppercase">Dias da semana</legend>
						<div class="flex flex-wrap gap-xs">
							{#each WEEKDAY_OPTIONS as day (day.value)}
								<label
									class={[
										'flex min-h-11 min-w-11 cursor-pointer items-center justify-center border border-frame px-sm font-sans text-caption uppercase touch-manipulation transition-colors duration-150',
										form.weekDays.includes(day.value)
											? 'bg-frame text-canvas'
											: 'bg-canvas text-ink hover:bg-muted'
									]}
								>
									<input
										type="checkbox"
										class="sr-only"
										checked={form.weekDays.includes(day.value)}
										onchange={() => toggleWeekDay(day.value)}
									/>
									{day.short}
								</label>
							{/each}
						</div>
					</fieldset>
				{/if}

				{#if form.frequency === 'monthly'}
					<label class="flex flex-col gap-xxs">
						<span class="font-sans text-ui-label uppercase">Dia do mês</span>
						<input
							class="text-input"
							type="number"
							name="dayOfMonth"
							inputmode="numeric"
							min="1"
							max="31"
							bind:value={form.dayOfMonth}
						/>
						<span class="font-serif text-caption text-muted-foreground">
							Em meses curtos, usa o último dia disponível.
						</span>
					</label>
				{/if}

				<label class="flex flex-col gap-xxs">
					<span class="font-sans text-ui-label uppercase">A partir de</span>
					<input class="text-input" type="date" name="startFrom" bind:value={form.startFrom} />
				</label>
			</div>

			<Sheet.Footer>
				<Button type="submit" disabled={submitting}>
					{submitting ? 'Salvando…' : editing ? 'Salvar alterações' : 'Criar recorrência'}
				</Button>
			</Sheet.Footer>
		</form>
	</Sheet.Content>
</Sheet.Root>
