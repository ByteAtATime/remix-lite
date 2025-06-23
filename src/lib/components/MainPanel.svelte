<script lang="ts">
	import AccountSelector from './AccountSelector.svelte';
	import TokenManager from './TokenManager.svelte';
	import InteractPanel from './InteractPanel.svelte';
	import type { AppSettings } from '$lib/stores/settings.svelte';

	let {
		activeTab,
		effectiveSettings
	}: { activeTab: 'interact' | 'token'; effectiveSettings: AppSettings } = $props();
</script>

<div class="flex h-full w-full flex-col overflow-y-auto">
	<AccountSelector />

	<div class="flex-grow p-4">
		{#if activeTab === 'token' && effectiveSettings.advancedMode}
			<TokenManager />
		{:else}
			<InteractPanel />
		{/if}
	</div>

	<footer class="mt-auto border-t p-4 text-center text-sm text-muted-foreground">
		<p>
			<a href="https://github.com/ByteAtATime/remix-lite" class="underline hover:opacity-80"
				>Fork me</a
			>
			· Built with ♡ at
			<a href="https://buidlguidl.com" class="underline hover:opacity-80">BuidlGuidl</a>
		</p>
	</footer>
</div>
