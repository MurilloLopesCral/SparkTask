export const MARKDOWN_TODO_CONTEXT = Symbol('markdown-todo');

export type MarkdownTodoContext = {
	claimIndex: () => number;
	toggle: (index: number) => void;
	interactive: boolean;
};
