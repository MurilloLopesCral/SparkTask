<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { Menu, X } from '@lucide/svelte';
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import {
		Home01Icon,
		Task01Icon,
		Folder01Icon,
		UserGroupIcon,
		UserIcon,
		Logout01Icon
	} from '@hugeicons/core-free-icons';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { getInitials } from '$lib/users/format';

	type NavUser = { name: string | null; email: string; image?: string | null };

	let { user, isGroupOwner = false }: { user: NavUser; isGroupOwner?: boolean } = $props();

	let mobileMenuOpen = $state(false);

	const navItems = [
		{ href: '/home', label: 'Início', icon: Home01Icon },
		{ href: '/projects', label: 'Projetos', icon: Folder01Icon },
		{ href: '/tasks', label: 'Tarefas', icon: Task01Icon },
		{ href: '/users', label: 'Grupos', icon: UserGroupIcon }
	] as const;

	const visibleNavItems = $derived(
		isGroupOwner ? navItems : navItems.filter((item) => item.href !== '/users')
	);

	const initials = $derived(getInitials(user.name, user.email));

	async function signOut() {
		mobileMenuOpen = false;
		await fetch('/logout', { method: 'POST' });
		await goto(resolve('/login'), { invalidateAll: true });
	}
</script>

<nav class="app-nav">
	<div class="flex min-w-0 items-center gap-lg">
		<a href={resolve('/home')} class="font-display text-h3 text-canvas uppercase">SparkTask</a>

		<div class="hidden items-center gap-xs md:flex">
			{#each visibleNavItems as item (item.href)}
				{@const active = page.url.pathname === item.href}
				<Tooltip.Root>
					<Tooltip.Trigger>
						{#snippet child({ props })}
							<a
								href={resolve(item.href)}
								aria-current={active ? 'page' : undefined}
								class="app-nav-icon"
								{...props}
							>
								<HugeiconsIcon icon={item.icon} strokeWidth={2} aria-hidden="true" />
								<span class="sr-only">{item.label}</span>
							</a>
						{/snippet}
					</Tooltip.Trigger>
					<Tooltip.Content side="bottom">{item.label}</Tooltip.Content>
				</Tooltip.Root>
			{/each}
		</div>
	</div>

	<div class="hidden items-center gap-sm md:flex">
		<DropdownMenu.Root>
			<DropdownMenu.Trigger>
				{#snippet child({ props })}
					<button type="button" class="rounded-full" aria-label="Menu da conta" {...props}>
						<Avatar.Root size="sm">
							<Avatar.Image src={user.image} alt={user.name ?? user.email} />
							<Avatar.Fallback>{initials}</Avatar.Fallback>
						</Avatar.Root>
					</button>
				{/snippet}
			</DropdownMenu.Trigger>
			<DropdownMenu.Content align="end">
				<DropdownMenu.Label>
					<span class="block font-sans text-ui-label uppercase">{user.name || 'Minha conta'}</span>
					<span class="block font-serif text-caption text-muted-foreground normal-case"
						>{user.email}</span
					>
				</DropdownMenu.Label>
				<DropdownMenu.Separator />
				<DropdownMenu.Item onSelect={() => goto(resolve('/profile'))}>
					<HugeiconsIcon icon={UserIcon} strokeWidth={2} aria-hidden="true" />
					Perfil
				</DropdownMenu.Item>
				<DropdownMenu.Item onSelect={signOut}>
					<HugeiconsIcon icon={Logout01Icon} strokeWidth={2} aria-hidden="true" />
					Sair
				</DropdownMenu.Item>
			</DropdownMenu.Content>
		</DropdownMenu.Root>

		<Tooltip.Root>
			<Tooltip.Trigger>
				{#snippet child({ props })}
					<button
						type="button"
						class="app-nav-icon"
						aria-label="Sair"
						{...props}
						onclick={signOut}
					>
						<HugeiconsIcon icon={Logout01Icon} strokeWidth={2} aria-hidden="true" />
					</button>
				{/snippet}
			</Tooltip.Trigger>
			<Tooltip.Content side="bottom">Sair</Tooltip.Content>
		</Tooltip.Root>
	</div>

	<div class="md:hidden">
		<Sheet.Root bind:open={mobileMenuOpen}>
			<Sheet.Trigger>
				{#snippet child({ props })}
					<button
						type="button"
						class="app-nav-icon touch-manipulation"
						aria-label={mobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
						aria-expanded={mobileMenuOpen}
						aria-controls="mobile-nav-menu"
						{...props}
					>
						{#if mobileMenuOpen}
							<X class="size-6" aria-hidden="true" />
						{:else}
							<Menu class="size-6" aria-hidden="true" />
						{/if}
					</button>
				{/snippet}
			</Sheet.Trigger>
			<Sheet.Content
				side="right"
				id="mobile-nav-menu"
				class="w-[min(100%,20rem)] gap-0 border-frame bg-canvas p-0"
				showCloseButton={false}
			>
				<Sheet.Header class="border-b border-frame bg-frame px-lg py-md text-left">
					<Sheet.Title class="font-display text-h3 text-canvas uppercase">Menu</Sheet.Title>
					<Sheet.Description class="font-serif text-caption text-canvas/70">
						{user.name || user.email}
					</Sheet.Description>
				</Sheet.Header>

				<nav
					class="flex flex-1 flex-col overflow-y-auto overscroll-contain p-sm"
					aria-label="Principal"
				>
					{#each visibleNavItems as item (item.href)}
						{@const active = page.url.pathname === item.href}
						<a
							href={resolve(item.href)}
							aria-current={active ? 'page' : undefined}
							class="mobile-nav-link"
							onclick={() => (mobileMenuOpen = false)}
						>
							<HugeiconsIcon icon={item.icon} strokeWidth={2} class="size-5" aria-hidden="true" />
							{item.label}
						</a>
					{/each}

					<a
						href={resolve('/profile')}
						aria-current={page.url.pathname === '/profile' ? 'page' : undefined}
						class="mobile-nav-link"
						onclick={() => (mobileMenuOpen = false)}
					>
						<HugeiconsIcon icon={UserIcon} strokeWidth={2} class="size-5" aria-hidden="true" />
						Perfil
					</a>
				</nav>

				<div class="border-t border-frame p-sm pb-[max(0.75rem,env(safe-area-inset-bottom))]">
					<button type="button" class="mobile-nav-link w-full text-destructive" onclick={signOut}>
						<HugeiconsIcon icon={Logout01Icon} strokeWidth={2} class="size-5" aria-hidden="true" />
						Sair
					</button>
				</div>
			</Sheet.Content>
		</Sheet.Root>
	</div>
</nav>
