<script lang="ts">
	import { Toaster } from '$lib/components/ui/sonner';
	import * as Sidebar from '$lib/components/ui/sidebar';
	import { ModeWatcher, setMode } from 'mode-watcher';
	import '../app.css';
	import { getAppSettings } from '$lib/stores/settings.svelte';
	import '@fontsource-variable/space-grotesk';

	let { children } = $props();

	setMode(getAppSettings().darkMode ? 'dark' : 'light');
</script>

<ModeWatcher />
<Toaster />

<Sidebar.Provider>
	<main class="h-screen w-full">
		{@render children()}
	</main>
</Sidebar.Provider>
