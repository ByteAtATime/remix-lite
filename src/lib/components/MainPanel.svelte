<script lang="ts">
	import AccountSelector from './AccountSelector.svelte';
	import TokenBalance from './TokenManager.svelte';
	import InteractPanel from './InteractPanel.svelte';
	import { Separator } from './ui/separator';

	let { activeTab }: { activeTab: 'interact' | 'token' } = $props();
</script>

<div class="flex h-full w-full flex-col overflow-y-auto">
	<div class="p-4">
		<AccountSelector />
	</div>

	<Separator />

	<div class="p-4">
		{#if activeTab === 'token'}
			<TokenBalance />
		{:else}
			<InteractPanel />
		{/if}
	</div>

	<div class="grow"></div>

	<footer class="mt-auto border-t border-gray-200 py-4 text-center text-sm text-gray-500">
		<p>
			<a href="https://github.com/ByteAtATime/remix-lite" class="underline hover:opacity-80"
				>Fork me</a
			>
			· Made with ❤️ at 🏰
			<a href="https://buidlguidl.com" class="underline hover:opacity-80">BuidlGuidl</a>
		</p>
	</footer>
</div>
