<script lang="ts">
	import { Toaster } from '$lib/components/ui/sonner';
	import * as Sidebar from '$lib/components/ui/sidebar';
	import { ModeWatcher } from 'mode-watcher';
	import '../app.css';

	let { children } = $props();
</script>

<ModeWatcher />
<Toaster />

<Sidebar.Provider>
	<main class="h-screen w-full">
		{@render children()}
	</main>
</Sidebar.Provider>
