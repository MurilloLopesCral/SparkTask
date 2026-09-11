import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';
import { defineConfig } from 'vite';

export default defineConfig({
	server: {
		port: 5181
	},
	plugins: [
		tailwindcss(),
		sveltekit(),
		SvelteKitPWA({
			registerType: 'autoUpdate',
			manifest: {
				name: 'SparkTask',
				short_name: 'SparkTask',
				description: 'Gestão de tarefas e projetos em grupo',
				start_url: '/',
				scope: '/',
				display: 'standalone',
				orientation: 'portrait-primary',
				lang: 'pt-BR',
				background_color: '#ffffff',
				theme_color: '#000000',
				icons: [
					{
						src: '/assets/sparktask_192.png',
						sizes: '192x192',
						type: 'image/png',
						purpose: 'any'
					},
					{
						src: '/assets/sparktask_512.png',
						sizes: '512x512',
						type: 'image/png',
						purpose: 'any'
					},
					{
						src: '/assets/sparktask_512.png',
						sizes: '512x512',
						type: 'image/png',
						purpose: 'maskable'
					}
				]
			},
			workbox: {
				navigateFallback: '/',
				globPatterns: ['client/**/*.{js,css,ico,png,svg,webp,webmanifest}']
			},
			devOptions: {
				enabled: true,
				type: 'module',
				navigateFallback: '/'
			},
			kit: {
				includeVersionFile: true
			}
		})
	]
});
