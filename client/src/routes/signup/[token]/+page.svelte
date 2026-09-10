<script lang="ts">
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { signupSchema } from '$lib/schemas/auth';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const { form, errors, constraints, enhance, delayed, message } = superForm(data.form, {
		validators: zod4Client(signupSchema)
	});
</script>

<svelte:head><title>Criar conta — SparkTask</title></svelte:head>

<main class="page-frame min-h-screen">
	<div class="page-frame-inner flex min-h-[calc(100vh-16px)] items-center justify-center p-lg">
		<div class="w-full max-w-form">
			<div class="ribbon-card">
				<div class="ribbon-card-title">CRIAR CONTA</div>
				<div class="ribbon-card-body ribbon-card-body--periwinkle">
					<p>
						Você foi convidado para o grupo <strong>{data.invite.groupName}</strong>. Defina seu
						nome e senha para entrar.
					</p>
				</div>
			</div>

			<form method="POST" use:enhance class="mt-lg border border-frame p-lg">
				{#if $message}
					<div class="cta-block-red mb-lg" role="alert">{$message}</div>
				{/if}

				<div class="mb-md">
					<span class="mb-xs block font-sans text-ui-label uppercase">E-mail</span>
					<div class="bg-muted text-input text-muted-foreground">{data.invite.email}</div>
				</div>

				<div class="mb-md">
					<label class="mb-xs block font-sans text-ui-label uppercase" for="name">Nome</label>
					<input
						id="name"
						name="name"
						type="text"
						class="text-input"
						aria-invalid={$errors.name ? 'true' : undefined}
						bind:value={$form.name}
						{...$constraints.name}
					/>
					{#if $errors.name}
						<p class="mt-xxs font-serif text-caption text-dell-red">{$errors.name}</p>
					{/if}
				</div>

				<div class="mb-md">
					<label class="mb-xs block font-sans text-ui-label uppercase" for="password">Senha</label>
					<input
						id="password"
						name="password"
						type="password"
						class="text-input"
						aria-invalid={$errors.password ? 'true' : undefined}
						bind:value={$form.password}
						{...$constraints.password}
					/>
					{#if $errors.password}
						<p class="mt-xxs font-serif text-caption text-dell-red">{$errors.password}</p>
					{/if}
				</div>

				<div class="mb-lg">
					<label class="mb-xs block font-sans text-ui-label uppercase" for="confirmPassword"
						>Confirmar senha</label
					>
					<input
						id="confirmPassword"
						name="confirmPassword"
						type="password"
						class="text-input"
						aria-invalid={$errors.confirmPassword ? 'true' : undefined}
						bind:value={$form.confirmPassword}
						{...$constraints.confirmPassword}
					/>
					{#if $errors.confirmPassword}
						<p class="mt-xxs font-serif text-caption text-dell-red">{$errors.confirmPassword}</p>
					{/if}
				</div>

				<button class="btn-primary w-full" type="submit" disabled={$delayed}>
					{$delayed ? 'CRIANDO CONTA…' : 'CRIAR CONTA'}
				</button>
			</form>
		</div>
	</div>
</main>
