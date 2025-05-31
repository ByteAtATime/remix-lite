<script lang="ts">
	import TokenBalance from './TokenManager.svelte';
	import InteractPanel from './InteractPanel.svelte';

	let { activeTab }: { activeTab: 'interact' | 'token' } = $props();
</script>

<div class="h-full w-full p-4">
	{#if activeTab === 'token'}
		<TokenBalance />
	{:else}
		<InteractPanel />
	{/if}
</div>
