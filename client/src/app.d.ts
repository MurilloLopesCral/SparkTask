// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { auth } from '$lib/server/auth';

type Session = typeof auth.$Infer.Session;

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			session: Session['session'] | null;
			user: Session['user'] | null;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

declare module 'virtual:pwa-info' {
	export interface PwaInfo {
		pwaInDevEnvironment: boolean;
		webManifest: {
			href: string;
			useCredentials: boolean;
			linkTag: string;
		};
	}
	export const pwaInfo: PwaInfo | undefined;
}

declare module 'virtual:pwa-register' {
	export interface RegisterSWOptions {
		immediate?: boolean;
		onRegistered?: (registration: ServiceWorkerRegistration | undefined) => void;
		onRegisteredSW?: (swScriptUrl: string, registration: ServiceWorkerRegistration | undefined) => void;
		onRegisterError?: (error: unknown) => void;
		onOfflineReady?: () => void;
		onNeedRefresh?: () => void;
	}
	export function registerSW(options?: RegisterSWOptions): (reloadPage?: boolean) => Promise<void>;
}

export {};
