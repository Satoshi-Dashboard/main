import { defineConfig } from 'vite';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
	plugins: [sveltekit(), tailwindcss()],

	server: {
		port: 5173,
		host: true,
		middlewareMode: false
	},

	preview: {
		port: 5173
	},

	build: {
		target: 'ES2020',
		minify: 'terser',
		sourcemap: false,
		rollupOptions: {
			output: {
				manualChunks: {
					vendor: ['svelte']
				}
			}
		}
	},

	optimizeDeps: {
		include: ['svelte']
	}
});
