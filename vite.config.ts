import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig({
	plugins: [
		sveltekit(),
		nodePolyfills({
			include: ['stream'],
			globals: {
				process: true,
				Buffer: true,
				global: true
			}
		})
	],
	worker: {
		format: 'es'
	}
});
