<script lang="ts">
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import { Camera01Icon } from '@hugeicons/core-free-icons';
	import { getInitials } from '$lib/users/format';
	import { updateProfile, updateWorkSchedule, uploadAvatar } from '$lib/users/profile-api';
	import {
		DEFAULT_WORK_SCHEDULE,
		WORK_WEEKDAYS,
		type WorkSchedule
	} from '$lib/users/work-schedule';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let form = $state(toFormState());
	let schedule = $state<WorkSchedule>(toScheduleState());
	let submitting = $state(false);
	let savingSchedule = $state(false);
	let uploadingAvatar = $state(false);

	function toFormState() {
		return { name: data.user.name ?? '', email: data.user.email };
	}

	function toScheduleState(): WorkSchedule {
		const s = data.schedule;
		return {
			enabled: s.enabled,
			timezone: s.timezone || DEFAULT_WORK_SCHEDULE.timezone,
			workDays: [...(s.workDays?.length ? s.workDays : DEFAULT_WORK_SCHEDULE.workDays)],
			startTime: s.startTime || DEFAULT_WORK_SCHEDULE.startTime,
			endTime: s.endTime || DEFAULT_WORK_SCHEDULE.endTime
		};
	}

	const initials = $derived(getInitials(data.user.name, data.user.email));

	function toggleWorkDay(day: number) {
		if (schedule.workDays.includes(day)) {
			schedule = {
				...schedule,
				workDays: schedule.workDays.filter((d) => d !== day)
			};
		} else {
			schedule = {
				...schedule,
				workDays: [...schedule.workDays, day].sort((a, b) => a - b)
			};
		}
	}

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		if (!form.name.trim() || !form.email.trim()) return;

		submitting = true;
		try {
			await updateProfile(form);
		} finally {
			submitting = false;
		}
	}

	async function handleScheduleSubmit(event: SubmitEvent) {
		event.preventDefault();
		savingSchedule = true;
		try {
			await updateWorkSchedule(schedule);
		} finally {
			savingSchedule = false;
		}
	}

	async function handleAvatarSelect(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const selected = input.files?.[0];
		input.value = '';
		if (!selected) return;

		uploadingAvatar = true;
		try {
			await uploadAvatar(selected);
		} finally {
			uploadingAvatar = false;
		}
	}
</script>

<svelte:head><title>Meu perfil — SparkTask</title></svelte:head>

<div
	class="mx-auto flex max-w-[32rem] flex-col gap-lg p-md pb-[max(1rem,env(safe-area-inset-bottom))] md:p-lg lg:p-section"
>
	<h1 class="font-display text-h1 text-pretty uppercase">Meu perfil</h1>

	<div class="flex items-center gap-md sm:gap-lg">
		<div class="relative shrink-0">
			<Avatar.Root size="lg" class="size-20">
				<Avatar.Image src={data.user.image} alt={data.user.name ?? data.user.email} />
				<Avatar.Fallback class="text-h3">{initials}</Avatar.Fallback>
			</Avatar.Root>
			<label
				class="btn-secondary absolute -right-1 -bottom-1 grid size-11 place-items-center rounded-full p-0 sm:size-7 {uploadingAvatar
					? 'pointer-events-none opacity-40'
					: ''}"
			>
				<HugeiconsIcon icon={Camera01Icon} strokeWidth={2} class="size-3.5" aria-hidden="true" />
				<span class="sr-only">Alterar foto</span>
				<input
					type="file"
					accept="image/*"
					class="sr-only"
					onchange={handleAvatarSelect}
					disabled={uploadingAvatar}
				/>
			</label>
		</div>
		<div class="flex flex-col gap-xxs">
			<span class="font-sans text-h3 uppercase">{data.user.name || 'Sem nome'}</span>
			<span class="font-serif text-body-sm text-muted-foreground">{data.user.email}</span>
			{#if !data.user.emailVerified}
				<Badge variant="destructive" class="w-fit">E-mail não verificado</Badge>
			{/if}
		</div>
	</div>

	<form onsubmit={handleSubmit} class="flex flex-col gap-md border-t border-frame pt-lg">
		<label class="flex flex-col gap-xxs">
			<span class="font-sans text-ui-label uppercase">Nome</span>
			<input
				class="text-input min-h-11"
				name="name"
				autocomplete="name"
				bind:value={form.name}
				required
			/>
		</label>

		<label class="flex flex-col gap-xxs">
			<span class="font-sans text-ui-label uppercase">E-mail</span>
			<input
				type="email"
				class="text-input min-h-11"
				name="email"
				autocomplete="email"
				bind:value={form.email}
				required
			/>
			<span class="font-serif text-caption text-muted-foreground">
				Trocar o e-mail exige confirmação por um link enviado ao novo endereço.
			</span>
		</label>

		<Button type="submit" disabled={submitting} class="min-h-11 w-full sm:w-fit">
			{submitting ? 'Salvando…' : 'Salvar alterações'}
		</Button>
	</form>

	<form
		onsubmit={handleScheduleSubmit}
		class="flex flex-col gap-md border-t border-frame pt-lg"
		aria-labelledby="work-schedule-heading"
	>
		<div class="flex flex-col gap-xxs">
			<h2 id="work-schedule-heading" class="font-display text-h2 uppercase scroll-mt-lg">
				Horário de funcionamento
			</h2>
			<p class="font-serif text-body-sm text-muted-foreground">
				Fora desse horário, o cron pausa automaticamente as suas execuções em andamento (fuso
				America/Sao_Paulo).
			</p>
		</div>

		<label class="flex min-h-11 cursor-pointer items-center gap-sm">
			<input
				type="checkbox"
				class="size-4 accent-dell-red"
				name="scheduleEnabled"
				autocomplete="off"
				bind:checked={schedule.enabled}
			/>
			<span class="font-sans text-ui-label uppercase">Pausar execuções automaticamente</span>
		</label>

		<fieldset class="flex flex-col gap-xs" disabled={!schedule.enabled}>
			<legend class="font-sans text-ui-label uppercase">Dias de trabalho</legend>
			<p class="font-serif text-caption text-muted-foreground">Toque nos dias em que você trabalha.</p>
			<div class="flex flex-wrap gap-xs" role="group" aria-label="Dias da semana">
				{#each WORK_WEEKDAYS as day (day.value)}
					{@const pressed = schedule.workDays.includes(day.value)}
					<button
						type="button"
						class="badge-sticker min-h-11 min-w-11 px-sm py-xs transition-opacity duration-150 focus-visible:ring-2 focus-visible:ring-frame focus-visible:outline-none {pressed
							? 'bg-sticker-yellow opacity-100 ring-2 ring-frame'
							: 'bg-muted opacity-50 hover:opacity-90'}"
						aria-pressed={pressed}
						aria-label={day.label}
						onclick={() => toggleWorkDay(day.value)}
					>
						{day.short}
					</button>
				{/each}
			</div>
		</fieldset>

		<div class="grid grid-cols-1 gap-sm sm:grid-cols-2">
			<label class="flex flex-col gap-xxs">
				<span class="font-sans text-ui-label uppercase">Início</span>
				<input
					type="time"
					class="text-input min-h-11"
					name="startTime"
					autocomplete="off"
					bind:value={schedule.startTime}
					disabled={!schedule.enabled}
					required
				/>
			</label>
			<label class="flex flex-col gap-xxs">
				<span class="font-sans text-ui-label uppercase">Fim</span>
				<input
					type="time"
					class="text-input min-h-11"
					name="endTime"
					autocomplete="off"
					bind:value={schedule.endTime}
					disabled={!schedule.enabled}
					required
				/>
			</label>
		</div>

		<Button type="submit" disabled={savingSchedule} class="min-h-11 w-full sm:w-fit">
			{savingSchedule ? 'Salvando…' : 'Salvar horário'}
		</Button>
	</form>
</div>
