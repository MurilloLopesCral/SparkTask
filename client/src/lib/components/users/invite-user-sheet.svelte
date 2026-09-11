<script lang="ts">
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import { Add01Icon } from '@hugeicons/core-free-icons';
	import { inviteUser } from '$lib/users/api';

	let { groupId }: { groupId: string } = $props();

	const roleOptions = [
		{ value: 'member', label: 'Membro' },
		{ value: 'moderator', label: 'Moderador' },
		{ value: 'owner', label: 'Owner' }
	];

	let open = $state(false);
	let submitting = $state(false);
	let form = $state(emptyForm());
	let result = $state<{ emailSent: boolean; signupUrl: string; message?: string } | null>(null);
	let copied = $state(false);

	function emptyForm() {
		return { email: '', role: 'member' };
	}

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		if (!form.email.trim()) return;

		submitting = true;
		result = null;
		try {
			const outcome = await inviteUser(groupId, form);
			if (!outcome.ok) {
				result = { emailSent: false, signupUrl: '', message: outcome.message };
				return;
			}
			result = { emailSent: outcome.emailSent ?? false, signupUrl: outcome.signupUrl ?? '' };
			form = emptyForm();
		} finally {
			submitting = false;
		}
	}

	async function copyLink() {
		if (!result?.signupUrl) return;
		await navigator.clipboard.writeText(result.signupUrl);
		copied = true;
		setTimeout(() => (copied = false), 2000);
	}

	function reset() {
		result = null;
		copied = false;
	}
</script>

<Sheet.Root bind:open onOpenChange={(next) => !next && reset()}>
	<Sheet.Trigger>
		{#snippet child({ props })}
			<Button {...props}>
				<HugeiconsIcon icon={Add01Icon} strokeWidth={2} />
				Convidar usuário
			</Button>
		{/snippet}
	</Sheet.Trigger>
	<Sheet.Content class="flex w-full flex-col sm:max-w-[24rem]">
		<form onsubmit={handleSubmit} class="flex h-full flex-col">
			<Sheet.Header>
				<Sheet.Title>Convidar usuário</Sheet.Title>
				<Sheet.Description>Envie um convite por e-mail para o seu grupo.</Sheet.Description>
			</Sheet.Header>

			<div class="flex flex-1 flex-col gap-md overflow-y-auto px-lg">
				{#if result}
					{#if result.message}
						<div class="alert-error">{result.message}</div>
					{:else if result.emailSent}
						<div class="border border-frame bg-tint-sage p-md font-serif text-body-sm">
							Convite enviado por e-mail com sucesso.
						</div>
					{:else}
						<div
							class="flex flex-col gap-sm border border-frame bg-tint-peach p-md font-serif text-body-sm"
						>
							<p>
								O convite foi criado, mas o e-mail não pôde ser enviado (SMTP não configurado).
								Copie o link e envie manualmente:
							</p>
							<div class="flex gap-xs">
								<input class="text-input" readonly value={result.signupUrl} />
								<button type="button" class="btn-secondary shrink-0" onclick={copyLink}>
									{copied ? 'Copiado!' : 'Copiar'}
								</button>
							</div>
						</div>
					{/if}
				{/if}

				<label class="flex flex-col gap-xxs">
					<span class="font-sans text-ui-label uppercase">E-mail</span>
					<input type="email" class="text-input" bind:value={form.email} required />
				</label>

				<label class="flex flex-col gap-xxs">
					<span class="font-sans text-ui-label uppercase">Papel</span>
					<Select.Root type="single" bind:value={form.role}>
						<Select.Trigger class="w-full">
							{roleOptions.find((r) => r.value === form.role)?.label}
						</Select.Trigger>
						<Select.Content>
							{#each roleOptions as option (option.value)}
								<Select.Item value={option.value} label={option.label} />
							{/each}
						</Select.Content>
					</Select.Root>
				</label>
			</div>

			<Sheet.Footer>
				<Button type="submit" disabled={submitting}>
					{submitting ? 'Enviando…' : 'Enviar convite'}
				</Button>
			</Sheet.Footer>
		</form>
	</Sheet.Content>
</Sheet.Root>
