import adapter from '@sveltejs/adapter-auto';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	compilerOptions: {
		// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
		runes: ({ filename }) =>
			filename.split(/[/\\]/).includes('node_modules') ? undefined : true
	},
	kit: {
		adapter: adapter(),
		// PWA registration is handled by virtual:pwa-register
		serviceWorker: {
			register: false
		},
		typescript: {
			config: (config) => {
				config.include.push('../drizzle.config.ts');
			}
		}
	}
};

export default config;
