import type { StatusReportPayload } from './status-report';

const KEY_PREFIX = 'sparktask:status-report-print:';

function pruneOldPrintStashes(keepId?: string) {
	const keys: string[] = [];
	for (let i = 0; i < localStorage.length; i++) {
		const key = localStorage.key(i);
		if (key?.startsWith(KEY_PREFIX)) keys.push(key);
	}
	for (const key of keys) {
		if (keepId && key === `${KEY_PREFIX}${keepId}`) continue;
		localStorage.removeItem(key);
	}
}

/** Persist report for a new tab (localStorage — sessionStorage is not shared across tabs). */
export function stashStatusReportForPrint(report: StatusReportPayload): string {
	const id = crypto.randomUUID();
	pruneOldPrintStashes();
	localStorage.setItem(`${KEY_PREFIX}${id}`, JSON.stringify(report));
	return id;
}

export function readStatusReportForPrint(id: string): StatusReportPayload | null {
	try {
		const raw = localStorage.getItem(`${KEY_PREFIX}${id}`);
		if (!raw) return null;
		return JSON.parse(raw) as StatusReportPayload;
	} catch {
		return null;
	}
}

export function clearStatusReportForPrint(id: string) {
	localStorage.removeItem(`${KEY_PREFIX}${id}`);
}

export function statusReportPrintUrl(id: string): string {
	return `/status-report/print?id=${encodeURIComponent(id)}`;
}
