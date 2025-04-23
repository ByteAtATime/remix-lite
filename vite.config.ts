import { sveltekit } from '@sveltejs/kit/vite';
import { vitePluginTevm } from 'tevm/bundler/vite-plugin';
import { defineConfig } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import vitePluginWasm from 'vite-plugin-wasm';

export default defineConfig({
	plugins: [sveltekit()]
});
