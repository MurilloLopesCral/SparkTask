<script lang="ts">
	import { Copy } from '@lucide/svelte';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import { highlightCode } from '$lib/tasks/highlight';

	let {
		lang = null,
		text = ''
	}: {
		lang?: string | null;
		text?: string;
	} = $props();

	let copied = $state(false);
	let copyReset: ReturnType<typeof setTimeout> | null = null;

	const highlighted = $derived(highlightCode(text ?? '', lang));
	const label = $derived(lang?.trim() || 'code');
	const tooltipLabel = $derived(copied ? 'Copiado' : 'Copiar');

	async function copyCode(event: MouseEvent) {
		event.preventDefault();
		event.stopPropagation();
		try {
			await navigator.clipboard.writeText(text ?? '');
			copied = true;
			if (copyReset) clearTimeout(copyReset);
			copyReset = setTimeout(() => {
				copied = false;
				copyReset = null;
			}, 1800);
		} catch {
			copied = false;
		}
	}
</script>

<div class="code-block" data-lang={label}>
	<div class="code-block-toolbar">
		<span class="code-block-lang">{label}</span>
		<Tooltip.Root>
			<Tooltip.Trigger>
				{#snippet child({ props })}
					<button
						{...props}
						type="button"
						class="code-block-copy"
						onclick={copyCode}
						aria-label={tooltipLabel}
					>
						<Copy class="size-3.5" />
					</button>
				{/snippet}
			</Tooltip.Trigger>
			<Tooltip.Content>{tooltipLabel}</Tooltip.Content>
		</Tooltip.Root>
	</div>
	<pre class="hljs"><code class={lang ? `language-${lang}` : undefined}>{@html highlighted}</code
		></pre>
</div>
