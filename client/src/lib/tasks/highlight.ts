import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import json from 'highlight.js/lib/languages/json';
import xml from 'highlight.js/lib/languages/xml';
import css from 'highlight.js/lib/languages/css';
import sql from 'highlight.js/lib/languages/sql';
import bash from 'highlight.js/lib/languages/bash';
import python from 'highlight.js/lib/languages/python';
import csharp from 'highlight.js/lib/languages/csharp';
import java from 'highlight.js/lib/languages/java';
import go from 'highlight.js/lib/languages/go';
import rust from 'highlight.js/lib/languages/rust';
import yaml from 'highlight.js/lib/languages/yaml';
import markdown from 'highlight.js/lib/languages/markdown';
import plaintext from 'highlight.js/lib/languages/plaintext';

let registered = false;

function ensureLanguages() {
	if (registered) return;
	hljs.registerLanguage('javascript', javascript);
	hljs.registerLanguage('js', javascript);
	hljs.registerLanguage('typescript', typescript);
	hljs.registerLanguage('ts', typescript);
	hljs.registerLanguage('tsx', typescript);
	hljs.registerLanguage('json', json);
	hljs.registerLanguage('html', xml);
	hljs.registerLanguage('xml', xml);
	hljs.registerLanguage('svg', xml);
	hljs.registerLanguage('css', css);
	hljs.registerLanguage('sql', sql);
	hljs.registerLanguage('bash', bash);
	hljs.registerLanguage('shell', bash);
	hljs.registerLanguage('sh', bash);
	hljs.registerLanguage('python', python);
	hljs.registerLanguage('py', python);
	hljs.registerLanguage('csharp', csharp);
	hljs.registerLanguage('cs', csharp);
	hljs.registerLanguage('java', java);
	hljs.registerLanguage('go', go);
	hljs.registerLanguage('rust', rust);
	hljs.registerLanguage('yaml', yaml);
	hljs.registerLanguage('yml', yaml);
	hljs.registerLanguage('markdown', markdown);
	hljs.registerLanguage('md', markdown);
	hljs.registerLanguage('plaintext', plaintext);
	hljs.registerLanguage('text', plaintext);
	registered = true;
}

function escapeHtml(value: string) {
	return value
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#39;');
}

/** Returns highlighted HTML for a fenced code block. Always escapes on failure. */
export function highlightCode(text: string, lang?: string | null) {
	ensureLanguages();
	const normalized = lang?.trim().toLowerCase() || '';

	try {
		if (normalized && hljs.getLanguage(normalized)) {
			return hljs.highlight(text, { language: normalized, ignoreIllegals: true }).value;
		}
		return hljs.highlightAuto(text).value;
	} catch {
		return escapeHtml(text);
	}
}
