<script lang="ts">
	import { Bold, Italic, List, ListOrdered, Quote, Heading, Keyboard } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import * as Kbd from '$lib/components/ui/kbd/index.js';
	import {
		applyMarkdownAction,
		formatShortcutKey,
		matchMarkdownShortcut,
		MARKDOWN_SHORTCUTS,
		type MarkdownAction
	} from '$lib/tasks/markdown-editor';

	let {
		value = $bindable(''),
		textareaEl = $bindable<HTMLTextAreaElement | null>(null)
	}: {
		value?: string;
		textareaEl?: HTMLTextAreaElement | null;
	} = $props();

	const headingOptions: { action: MarkdownAction; label: string }[] = [
		{ action: 'h1', label: 'H1' },
		{ action: 'h2', label: 'H2' },
		{ action: 'h3', label: 'H3' },
		{ action: 'h4', label: 'H4' },
		{ action: 'h5', label: 'H5' },
		{ action: 'h6', label: 'H6' }
	];

	function runAction(action: MarkdownAction) {
		const el = textareaEl;
		const start = el?.selectionStart ?? value.length;
		const end = el?.selectionEnd ?? value.length;
		const { next, cursorStart, cursorEnd } = applyMarkdownAction(value, start, end, action);
		value = next;

		queueMicrotask(() => {
			if (!el) return;
			el.focus();
			el.setSelectionRange(cursorStart, cursorEnd);
		});
	}

	function onTextareaKeydown(event: KeyboardEvent) {
		const action = matchMarkdownShortcut(event);
		if (!action) return;
		event.preventDefault();
		runAction(action);
	}

	$effect(() => {
		const el = textareaEl;
		if (!el) return;
		el.addEventListener('keydown', onTextareaKeydown);
		return () => el.removeEventListener('keydown', onTextareaKeydown);
	});
</script>

<div
	class="flex flex-wrap items-center gap-xxs border border-b-0 border-frame bg-canvas px-xs py-xxs"
	role="toolbar"
	aria-label="Formatação Markdown"
>
	<Button
		type="button"
		variant="ghost"
		size="icon-xs"
		onclick={() => runAction('bold')}
		aria-label="Negrito"
		title="Negrito"
	>
		<Bold />
	</Button>
	<Button
		type="button"
		variant="ghost"
		size="icon-xs"
		onclick={() => runAction('italic')}
		aria-label="Itálico"
		title="Itálico"
	>
		<Italic />
	</Button>

	<span class="mx-xxs h-4 w-px bg-frame" aria-hidden="true"></span>

	<Button
		type="button"
		variant="ghost"
		size="icon-xs"
		onclick={() => runAction('unordered')}
		aria-label="Lista não ordenada"
		title="Lista não ordenada"
	>
		<List />
	</Button>
	<Button
		type="button"
		variant="ghost"
		size="icon-xs"
		onclick={() => runAction('ordered')}
		aria-label="Lista ordenada"
		title="Lista ordenada"
	>
		<ListOrdered />
	</Button>
	<Button
		type="button"
		variant="ghost"
		size="icon-xs"
		onclick={() => runAction('blockquote')}
		aria-label="Citação"
		title="Citação / herança (>)"
	>
		<Quote />
	</Button>

	<span class="mx-xxs h-4 w-px bg-frame" aria-hidden="true"></span>

	<DropdownMenu.Root>
		<DropdownMenu.Trigger>
			{#snippet child({ props })}
				<Button
					{...props}
					type="button"
					variant="ghost"
					size="icon-xs"
					aria-label="Títulos"
					title="Títulos H1–H6"
				>
					<Heading />
				</Button>
			{/snippet}
		</DropdownMenu.Trigger>
		<DropdownMenu.Content align="start">
			{#each headingOptions as option (option.action)}
				<DropdownMenu.Item onSelect={() => runAction(option.action)}>
					{option.label}
				</DropdownMenu.Item>
			{/each}
		</DropdownMenu.Content>
	</DropdownMenu.Root>

	<div class="ms-auto">
		<Popover.Root>
			<Popover.Trigger>
				{#snippet child({ props })}
					<button
						{...props}
						type="button"
						class="inline-flex items-center"
						aria-label="Atalhos de formatação"
						title="Atalhos de formatação"
					>
						<Kbd.Root>
							<Keyboard class="size-3" />
						</Kbd.Root>
					</button>
				{/snippet}
			</Popover.Trigger>
			<Popover.Content align="end" class="w-80 gap-sm p-md">
				<Popover.Header class="gap-xxs p-0">
					<Popover.Title class="font-sans text-ui-label uppercase">Atalhos</Popover.Title>
					<Popover.Description class="font-serif text-caption text-muted-foreground">
						Atalhos disponíveis na descrição.
					</Popover.Description>
				</Popover.Header>
				<ul class="flex flex-col gap-xs">
					{#each MARKDOWN_SHORTCUTS as shortcut (shortcut.action)}
						<li class="flex items-center justify-between gap-sm font-serif text-body-sm">
							<span>{shortcut.label}</span>
							<Kbd.Group>
								{#each shortcut.displayKeys as key (key)}
									<Kbd.Root>{formatShortcutKey(key)}</Kbd.Root>
								{/each}
							</Kbd.Group>
						</li>
					{/each}
				</ul>
			</Popover.Content>
		</Popover.Root>
	</div>
</div>
