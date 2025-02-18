<script lang="ts">
	import { CheckCircle, Copy, type Icon as IconType } from 'lucide-svelte';
	import type { Snippet } from 'svelte';

	type Props = {
		text: string;
		child?: Snippet<[{ copy: () => void; Icon: typeof IconType }]>;
	};

	let { text, child }: Props = $props();

	let isCopied = $state(false);

	function copyToClipboard(text: string) {
		navigator.clipboard.writeText(text);
		isCopied = true;
		setTimeout(() => (isCopied = false), 2000);
	}
</script>

{#if !child}
	<button onclick={() => copyToClipboard(text)} class="rounded p-1 hover:bg-gray-100">
		{#if !isCopied}
			<Copy class="h-4 w-4" />
		{:else}
			<CheckCircle class="h-4 w-4" />
		{/if}
	</button>
{:else}
	{@render child({
		copy: () => copyToClipboard(text),
		Icon: isCopied ? CheckCircle : Copy
	})}
{/if}
