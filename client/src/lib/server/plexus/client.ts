import { getPlexusConfig } from './config';
import type { PlexusGanttStatus } from './map';

export class PlexusApiError extends Error {
	constructor(
		message: string,
		readonly status: number,
		readonly body: unknown
	) {
		super(message);
		this.name = 'PlexusApiError';
	}
}

export type CreateGanttItemInput = {
	title: string;
	ownerId: number;
	startDate: string;
	endDate: string;
	percentComplete: number;
	activityDescription?: string | null;
	status?: PlexusGanttStatus;
	scopeType: 'PROJECT' | 'CHANGE_REQUEST';
	scopeId: number;
	topicCode: string;
};

export type UpdateGanttItemInput = {
	title?: string;
	ownerId?: number;
	startDate?: string;
	endDate?: string;
	activityDescription?: string | null;
	status?: PlexusGanttStatus;
	percentComplete?: number;
};

export type GanttItemResponse = {
	id: number;
	title: string;
	status: PlexusGanttStatus;
	percentComplete: number;
	startDate: string;
	endDate: string;
};

async function plexusFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
	const config = getPlexusConfig();
	if (!config) throw new Error('Plexus não configurado.');

	const headers = new Headers(init.headers);
	headers.set('Authorization', `Bearer ${config.serviceKey}`);
	headers.set('Accept', 'application/json');
	if (init.body && !headers.has('Content-Type')) {
		headers.set('Content-Type', 'application/json');
	}

	const res = await fetch(`${config.baseUrl}${path}`, { ...init, headers });
	const text = await res.text();
	const body = text ? safeJson(text) : null;

	if (!res.ok) {
		throw new PlexusApiError(
			`Plexus ${init.method ?? 'GET'} ${path} → ${res.status}`,
			res.status,
			body
		);
	}

	return body as T;
}

function safeJson(text: string) {
	try {
		return JSON.parse(text);
	} catch {
		return text;
	}
}

export async function createGanttItem(input: CreateGanttItemInput) {
	return plexusFetch<GanttItemResponse>('/service/v1/ganttitems', {
		method: 'POST',
		body: JSON.stringify({
			title: input.title,
			ownerId: input.ownerId,
			startDate: input.startDate,
			endDate: input.endDate,
			percentComplete: input.percentComplete,
			activityDescription: input.activityDescription ?? undefined,
			status: input.status,
			scopeType: input.scopeType,
			scopeId: input.scopeId,
			topicCode: input.topicCode
		})
	});
}

export async function updateGanttItem(ganttId: number, input: UpdateGanttItemInput) {
	return plexusFetch<GanttItemResponse>(`/service/v1/ganttitems/${ganttId}`, {
		method: 'PATCH',
		body: JSON.stringify(input)
	});
}

export async function deleteGanttItem(ganttId: number) {
	await plexusFetch<unknown>(`/service/v1/ganttitems/${ganttId}`, { method: 'DELETE' });
}

export type PlexusUserSummary = {
	id: number;
	name: string | null;
	email: string;
	function: string;
	isActive: boolean;
};

/** GET /service/v1/users?q= — requires users:read on the service key. */
export async function searchPlexusUsers(query: string, limit = 20) {
	const q = query.trim();
	const params = new URLSearchParams({ limit: String(limit) });
	if (q) params.set('q', q);
	const body = await plexusFetch<PlexusUserSummary[] | { data: PlexusUserSummary[] }>(
		`/service/v1/users?${params}`
	);
	// Plexus returns a paginated envelope `{ data, page, limit, total }`.
	return Array.isArray(body) ? body : (body?.data ?? []);
}
