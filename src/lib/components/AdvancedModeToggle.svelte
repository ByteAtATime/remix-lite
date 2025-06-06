<script lang="ts">
	import { getAppSettings, toggleAdvancedMode, toggleDarkMode } from '$lib/stores/settings.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Settings, Zap, Sun, Moon } from 'lucide-svelte';

	const settings = $derived(getAppSettings());
</script>

<div class="flex items-center gap-2">
	<Button
		variant="ghost"
		size="sm"
		onclick={toggleDarkMode}
		class="flex items-center gap-2 text-sm"
	>
		{#if settings.darkMode}
			<Sun class="h-4 w-4" />
		{:else}
			<Moon class="h-4 w-4" />
		{/if}
	</Button>

	<Button
		variant="ghost"
		size="sm"
		onclick={toggleAdvancedMode}
		class="flex items-center gap-2 text-sm"
	>
		{#if settings.advancedMode}
			<Zap class="h-4 w-4" />
			Simple Mode
		{:else}
			<Settings class="h-4 w-4" />
			Advanced Mode
		{/if}
	</Button>
</div>
