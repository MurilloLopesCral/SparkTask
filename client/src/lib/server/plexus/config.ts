import { env } from '$env/dynamic/private';

export type PlexusConfig = {
	baseUrl: string;
	serviceKey: string;
};

/** Returns null when integration is not configured — callers should no-op. */
export function getPlexusConfig(): PlexusConfig | null {
	const baseUrl = env.PLEXUS_API_BASE_URL?.trim().replace(/\/+$/, '');
	const serviceKey = env.PLEXUS_SERVICE_KEY?.trim();
	if (!baseUrl || !serviceKey) return null;
	return { baseUrl, serviceKey };
}

export function isPlexusConfigured() {
	return getPlexusConfig() !== null;
}
