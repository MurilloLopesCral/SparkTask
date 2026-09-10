<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
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
	import { getInitials } from '$lib/users/format';

	type NavUser = { name: string | null; email: string; image?: string | null };

	let { user, isGroupOwner = false }: { user: NavUser; isGroupOwner?: boolean } = $props();

	// One entry per screen behind the navbar. Add to this list as new
	// authenticated routes ship — the icon + tooltip wiring is already here.
	const navItems = [
		{ href: '/home', label: 'Início', icon: Home01Icon },
		{ href: '/projects', label: 'Projetos', icon: Folder01Icon },
		{ href: '/tasks', label: 'Tarefas', icon: Task01Icon },
		{ href: '/users', label: 'Usuários', icon: UserGroupIcon }
	] as const;

	const visibleNavItems = $derived(
		isGroupOwner ? navItems : navItems.filter((item) => item.href !== '/users')
	);

	const initials = $derived(getInitials(user.name, user.email));

	async function signOut() {
		await fetch('/logout', { method: 'POST' });
		await goto(resolve('/login'), { invalidateAll: true });
	}
</script>

<nav class="app-nav">
	<div class="flex items-center gap-lg">
		<a href={resolve('/home')} class="font-display text-h3 text-canvas uppercase">SparkTask</a>

		<div class="flex items-center gap-xs">
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
								<HugeiconsIcon icon={item.icon} strokeWidth={2} />
								<span class="sr-only">{item.label}</span>
							</a>
						{/snippet}
					</Tooltip.Trigger>
					<Tooltip.Content side="bottom">{item.label}</Tooltip.Content>
				</Tooltip.Root>
			{/each}
		</div>
	</div>

	<div class="flex items-center gap-sm">
		<DropdownMenu.Root>
			<DropdownMenu.Trigger>
				{#snippet child({ props })}
					<button type="button" class="rounded-full" {...props}>
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
					<HugeiconsIcon icon={UserIcon} strokeWidth={2} />
					Editar perfil
				</DropdownMenu.Item>
				<DropdownMenu.Item onSelect={signOut}>
					<HugeiconsIcon icon={Logout01Icon} strokeWidth={2} />
					Sair
				</DropdownMenu.Item>
			</DropdownMenu.Content>
		</DropdownMenu.Root>

		<Tooltip.Root>
			<Tooltip.Trigger>
				{#snippet child({ props })}
					<button type="button" class="app-nav-icon" {...props} onclick={signOut}>
						<HugeiconsIcon icon={Logout01Icon} strokeWidth={2} />
						<span class="sr-only">Sair</span>
					</button>
				{/snippet}
			</Tooltip.Trigger>
			<Tooltip.Content side="bottom">Sair</Tooltip.Content>
		</Tooltip.Root>
	</div>
</nav>
