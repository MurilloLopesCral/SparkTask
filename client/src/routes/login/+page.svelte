<script lang="ts">
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { loginSchema } from '$lib/schemas/auth';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const { form, errors, constraints, enhance, delayed, message } = superForm(data.form, {
		validators: zod4Client(loginSchema)
	});

	// Fanned preview of tinted project cards — the same visual language the
	// real project list will use, foreshadowed here rather than decoration.
	const fanCards = [
		{ label: 'ROADMAP', tint: 'sage', top: 4, left: 0, rotate: -9, z: 1 },
		{ label: 'SUPORTE', tint: 'salmon', top: 54, left: 92, rotate: 7, z: 3 },
		{ label: 'ONBOARDING', tint: 'periwinkle', top: 10, left: 188, rotate: -5, z: 2 },
		{ label: 'BACKLOG', tint: 'sky', top: 96, left: 24, rotate: 11, z: 2 },
		{ label: 'MARKETING', tint: 'peach', top: 76, left: 236, rotate: -13, z: 1 }
	];
</script>

<svelte:head><title>Entrar — SparkTask</title></svelte:head>

<main class="page-frame min-h-screen">
	<div class="page-frame-inner grid min-h-[calc(100vh-16px)] lg:grid-cols-[1.15fr_1fr]">
		<!-- Brand panel -->
		<section
			class="relative hidden overflow-hidden bg-frame p-lg lg:flex lg:flex-col lg:justify-between lg:p-section"
		>
			<span class="font-display text-h3 text-canvas uppercase">SparkTask</span>

			<div class="fan-stack relative h-[220px] w-full max-w-[24rem]">
				{#each fanCards as card, i (card.label)}
					<div
						class="fan-card ribbon-card-body--{card.tint} absolute grid h-16 w-32 place-items-center border border-frame font-sans text-ui-label text-ink uppercase"
						style="top: {card.top}px; left: {card.left}px; z-index: {card.z}; --rotate: {card.rotate}deg; --delay: {i *
							80}ms;"
					>
						{card.label}
					</div>
				{/each}
			</div>

			<div class="max-w-[24rem]">
				<p class="font-display text-display leading-none text-canvas uppercase">
					Suas demandas.<br />Um só lugar.
				</p>
				<p class="mt-md font-serif text-body text-canvas/70">
					Cadastre, acompanhe e divida tarefas com o seu grupo — sem planilha, sem perder o fio.
				</p>
			</div>
		</section>

		<!-- Form panel -->
		<section class="flex items-center justify-center p-lg lg:p-section">
			<div class="w-full max-w-form">
				<div class="mb-xxl flex items-center justify-between lg:hidden">
					<span class="font-display text-h3 uppercase">SparkTask</span>
				</div>

				<span class="font-sans text-ui-label text-muted-foreground uppercase">Acesso</span>
				<h1 class="mt-xs font-display text-h1 uppercase">Bem-vindo de volta.</h1>
				<p class="mt-xs font-serif text-body text-muted-foreground">
					Entre com o e-mail e a senha do seu convite.
				</p>

				<form method="POST" use:enhance class="mt-xxl">
					{#if $message}
						<div class="alert-error mb-lg" role="alert">{$message}</div>
					{/if}

					<div class="mb-md">
						<label class="mb-xs block font-sans text-ui-label uppercase" for="email">E-mail</label>
						<input
							id="email"
							name="email"
							type="email"
							autocomplete="email"
							class="px-md py-sm text-input"
							aria-invalid={$errors.email ? 'true' : undefined}
							bind:value={$form.email}
							{...$constraints.email}
							pattern={undefined}
						/>
						{#if $errors.email}
							<p class="mt-xxs font-serif text-caption text-dell-red">{$errors.email}</p>
						{/if}
					</div>

					<div class="mb-lg">
						<label class="mb-xs block font-sans text-ui-label uppercase" for="password">Senha</label
						>
						<input
							id="password"
							name="password"
							type="password"
							autocomplete="current-password"
							class="px-md py-sm text-input"
							aria-invalid={$errors.password ? 'true' : undefined}
							bind:value={$form.password}
							{...$constraints.password}
						/>
						{#if $errors.password}
							<p class="mt-xxs font-serif text-caption text-dell-red">{$errors.password}</p>
						{/if}
					</div>

					<button class="btn-primary w-full py-md" type="submit" disabled={$delayed}>
						{$delayed ? 'ENTRANDO…' : 'ENTRAR'}
					</button>
				</form>

				<p class="mt-lg font-serif text-body-sm text-muted-foreground">
					Só entra quem foi convidado por um grupo — fale com quem te convidou se ainda não tem
					conta.
				</p>
			</div>
		</section>
	</div>
</main>

<style>
	.fan-card {
		transform: rotate(var(--rotate));
		animation: fan-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) backwards;
		animation-delay: var(--delay);
	}

	@keyframes fan-in {
		from {
			opacity: 0;
			transform: translateY(20px) scale(0.92) rotate(0deg);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1) rotate(var(--rotate));
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.fan-card {
			animation: none;
			opacity: 1;
		}
	}
</style>
