<script lang="ts">
	import { CheckCircle, Copy } from 'lucide-svelte';

	type Props = {
		text: string;
	};

	let { text }: Props = $props();

	let isCopied = $state(false);

	function copyToClipboard(text: string, label: string) {
		navigator.clipboard.writeText(text);
		isCopied = true;
		setTimeout(() => (isCopied = false), 2000);
	}
</script>

<button onclick={() => copyToClipboard(text, 'text')} class="rounded p-1 hover:bg-gray-100">
	{#if !isCopied}
		<Copy class="h-4 w-4" />
	{:else}
		<CheckCircle class="h-4 w-4" />
	{/if}
</button>
