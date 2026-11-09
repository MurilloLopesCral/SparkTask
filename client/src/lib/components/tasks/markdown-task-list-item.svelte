<script lang="ts">
	import { getContext, untrack, type Snippet } from 'svelte';
	import {
		MARKDOWN_TODO_CONTEXT,
		type MarkdownTodoContext
	} from '$lib/tasks/markdown-todo-context';

	let {
		task = false,
		checked = false,
		children
	}: {
		task?: boolean;
		checked?: boolean;
		children?: Snippet;
	} = $props();

	const todos = getContext<MarkdownTodoContext | undefined>(MARKDOWN_TODO_CONTEXT);
	// One index per list-item instance; claim once at create time.
	const index = untrack(() => (task && todos ? todos.claimIndex() : -1));

	function handleChange(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		// Keep visual state until the parent re-renders from the updated source.
		input.checked = checked;
		if (index >= 0) todos?.toggle(index);
	}
</script>

<li class:task-list-item={task}>
	{#if task}
		<input
			type="checkbox"
			class="task-list-checkbox"
			checked={checked}
			disabled={!todos?.interactive}
			onchange={handleChange}
			aria-label={checked ? 'Marcar como pendente' : 'Marcar como concluída'}
		/>
	{/if}
	<span class="task-list-content">
		{@render children?.()}
	</span>
</li>
