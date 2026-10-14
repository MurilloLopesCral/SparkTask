<script lang="ts">
	import { setContext } from 'svelte';
	import SvelteMarkdown from 'svelte-markdown';
	import MarkdownTaskListItem from './markdown-task-list-item.svelte';
	import {
		MARKDOWN_TODO_CONTEXT,
		type MarkdownTodoContext
	} from '$lib/tasks/markdown-todo-context';

	let {
		source,
		interactive = false,
		ontoggle
	}: {
		source: string;
		interactive?: boolean;
		ontoggle?: (index: number) => void;
	} = $props();

	let counter = 0;

	$effect.pre(() => {
		void source;
		counter = 0;
	});

	const ctx: MarkdownTodoContext = {
		claimIndex: () => counter++,
		toggle: (index) => ontoggle?.(index),
		get interactive() {
			return interactive;
		}
	};

	setContext(MARKDOWN_TODO_CONTEXT, ctx);

	const renderers = {
		listitem: MarkdownTaskListItem
	};
</script>

<SvelteMarkdown {source} {renderers} />
