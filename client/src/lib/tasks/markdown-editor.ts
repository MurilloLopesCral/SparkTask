export type MarkdownAction =
	| 'bold'
	| 'italic'
	| 'unordered'
	| 'ordered'
	| 'blockquote'
	| 'h1'
	| 'h2'
	| 'h3'
	| 'h4'
	| 'h5'
	| 'h6';

export type ShortcutMod = 'mod' | 'mod-shift' | 'mod-alt';

export type MarkdownShortcut = {
	action: MarkdownAction;
	label: string;
	mod: ShortcutMod;
	key: string;
	displayKeys: string[];
};

const HEADING_PREFIX: Record<string, string> = {
	h1: '# ',
	h2: '## ',
	h3: '### ',
	h4: '#### ',
	h5: '##### ',
	h6: '###### '
};

export const MARKDOWN_SHORTCUTS: MarkdownShortcut[] = [
	{ action: 'bold', label: 'Negrito', mod: 'mod', key: 'b', displayKeys: ['Mod', 'B'] },
	{ action: 'italic', label: 'Itálico', mod: 'mod', key: 'i', displayKeys: ['Mod', 'I'] },
	{
		action: 'unordered',
		label: 'Lista não ordenada',
		mod: 'mod-shift',
		key: '8',
		displayKeys: ['Mod', 'Shift', '8']
	},
	{
		action: 'ordered',
		label: 'Lista ordenada',
		mod: 'mod-shift',
		key: '7',
		displayKeys: ['Mod', 'Shift', '7']
	},
	{
		action: 'blockquote',
		label: 'Citação / herança',
		mod: 'mod-shift',
		key: '.',
		displayKeys: ['Mod', 'Shift', '.']
	},
	{ action: 'h1', label: 'Título H1', mod: 'mod-alt', key: '1', displayKeys: ['Mod', 'Alt', '1'] },
	{ action: 'h2', label: 'Título H2', mod: 'mod-alt', key: '2', displayKeys: ['Mod', 'Alt', '2'] },
	{ action: 'h3', label: 'Título H3', mod: 'mod-alt', key: '3', displayKeys: ['Mod', 'Alt', '3'] },
	{ action: 'h4', label: 'Título H4', mod: 'mod-alt', key: '4', displayKeys: ['Mod', 'Alt', '4'] },
	{ action: 'h5', label: 'Título H5', mod: 'mod-alt', key: '5', displayKeys: ['Mod', 'Alt', '5'] },
	{ action: 'h6', label: 'Título H6', mod: 'mod-alt', key: '6', displayKeys: ['Mod', 'Alt', '6'] }
];

export function isApplePlatform(): boolean {
	if (typeof navigator === 'undefined') return false;
	return /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent);
}

export function formatShortcutKey(key: string): string {
	if (key === 'Mod') return isApplePlatform() ? '⌘' : 'Ctrl';
	if (key === 'Shift') return isApplePlatform() ? '⇧' : 'Shift';
	if (key === 'Alt') return isApplePlatform() ? '⌥' : 'Alt';
	return key;
}

function wrapInline(
	value: string,
	start: number,
	end: number,
	before: string,
	after: string,
	placeholder: string
) {
	const selected = value.slice(start, end);
	const content = selected || placeholder;
	const next = value.slice(0, start) + before + content + after + value.slice(end);
	const cursorStart = start + before.length;
	const cursorEnd = cursorStart + content.length;
	return { next, cursorStart, cursorEnd };
}

function toggleLinePrefix(
	value: string,
	start: number,
	end: number,
	prefix: string,
	ordered = false
) {
	const lineStart = value.lastIndexOf('\n', start - 1) + 1;
	const lineEndIdx = value.indexOf('\n', end);
	const lineEnd = lineEndIdx === -1 ? value.length : lineEndIdx;
	const block = value.slice(lineStart, lineEnd);
	const lines = block.split('\n');

	const headingRe = /^#{1,6}\s+/;
	const quoteRe = /^>\s?/;
	const unorderedRe = /^[-*+]\s+/;
	const orderedRe = /^\d+\.\s+/;

	const stripKnown = (line: string) =>
		line.replace(headingRe, '').replace(quoteRe, '').replace(unorderedRe, '').replace(orderedRe, '');

	const allHavePrefix = lines.every((line) => {
		if (ordered) return orderedRe.test(line);
		if (prefix === '> ') return quoteRe.test(line);
		if (prefix.startsWith('#')) return line.startsWith(prefix);
		return unorderedRe.test(line);
	});

	const nextLines = lines.map((line, index) => {
		const bare = stripKnown(line);
		if (allHavePrefix) return bare;
		if (ordered) return `${index + 1}. ${bare}`;
		return `${prefix}${bare}`;
	});

	const joined = nextLines.join('\n');
	const next = value.slice(0, lineStart) + joined + value.slice(lineEnd);
	return {
		next,
		cursorStart: lineStart,
		cursorEnd: lineStart + joined.length
	};
}

export function applyMarkdownAction(
	value: string,
	start: number,
	end: number,
	action: MarkdownAction
): { next: string; cursorStart: number; cursorEnd: number } {
	switch (action) {
		case 'bold':
			return wrapInline(value, start, end, '**', '**', 'negrito');
		case 'italic':
			return wrapInline(value, start, end, '*', '*', 'itálico');
		case 'unordered':
			return toggleLinePrefix(value, start, end, '- ');
		case 'ordered':
			return toggleLinePrefix(value, start, end, '1. ', true);
		case 'blockquote':
			return toggleLinePrefix(value, start, end, '> ');
		case 'h1':
		case 'h2':
		case 'h3':
		case 'h4':
		case 'h5':
		case 'h6':
			return toggleLinePrefix(value, start, end, HEADING_PREFIX[action]);
	}
}

export function matchMarkdownShortcut(
	event: KeyboardEvent
): MarkdownAction | null {
	const key = event.key.toLowerCase();
	const mod = isApplePlatform() ? event.metaKey : event.ctrlKey;
	if (!mod) return null;

	for (const shortcut of MARKDOWN_SHORTCUTS) {
		const keyMatch = shortcut.key.toLowerCase() === key;
		if (!keyMatch) continue;

		if (shortcut.mod === 'mod' && !event.shiftKey && !event.altKey) return shortcut.action;
		if (shortcut.mod === 'mod-shift' && event.shiftKey && !event.altKey) return shortcut.action;
		if (shortcut.mod === 'mod-alt' && event.altKey && !event.shiftKey) return shortcut.action;
	}

	return null;
}
