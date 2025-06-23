<script lang="ts">
	import { getAppSettings, toggleDarkMode } from '$lib/stores/settings.svelte';
	import { Sun, Moon } from 'lucide-svelte';

	const settings = $derived(getAppSettings());
</script>

<button
	onclick={toggleDarkMode}
	class="relative flex h-8 w-14 items-center rounded-full bg-muted p-1 transition-colors"
	aria-label="Toggle Dark Mode"
>
	<div
		class="absolute flex h-6 w-6 transform items-center justify-center rounded-full bg-background shadow-md transition-transform"
		class:translate-x-6={settings.darkMode}
		class:translate-x-0={!settings.darkMode}
	>
		{#if settings.darkMode}
			<Moon class="h-4 w-4" />
		{:else}
			<Sun class="h-4 w-4" />
		{/if}
	</div>
</button>
