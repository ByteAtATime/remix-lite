<script lang="ts">
	import { Card } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Check, Share2, Lock, Pin, PinOff } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';
	import CopyButton from './CopyButton.svelte';
	import VariableDisplay from './VariableDisplay.svelte';
	import { getContract, getContractAbi, getContractAddress } from '$lib/stores/contract.svelte';
	import { getEditorState } from '$lib/stores/editor.svelte';
	import { client } from '$lib/client';
	import type { AbiFunction } from 'abitype';

	type Props = {
		ondeploy: () => void;
		isPinned?: boolean;
	};

	let { ondeploy, isPinned = $bindable(false) }: Props = $props();

	let contract = $derived(getContract());
	let abi = $derived(getContractAbi());
	let address = $derived(getContractAddress());

	const { code, isDeploying } = $derived(getEditorState());

	let isSharing = $state(false);

	let variables = $derived(
		abi.filter(
			(item): item is AbiFunction =>
				item.type === 'function' &&
				(item.stateMutability === 'view' || item.stateMutability === 'pure') &&
				item.inputs.length === 0
		)
	);

	const shareCode = async () => {
		try {
			const encodedCode = btoa(encodeURIComponent(code));
			const url = `${window.location.origin}${window.location.pathname}#code=${encodedCode}`;
			await navigator.clipboard.writeText(url);
			isSharing = true;
			setTimeout(() => {
				isSharing = false;
			}, 2000);
			toast.success('Link Copied', { description: 'Shareable link has been copied to clipboard' });
		} catch (error) {
			console.error('Failed to create share link:', error);
			toast.error('Failed to create link', {
				description: 'Could not generate shareable link'
			});
		}
	};
</script>

<Card
	class="relative p-4 {isPinned ? 'sticky top-0 z-10 bg-card/95 shadow-xl backdrop-blur-md' : ''}"
>
	<div class="mb-4 flex items-center justify-between">
		<h2 class="text-xl font-bold">Contract details</h2>
		<div class="flex items-center gap-2">
			<Button
				onclick={ondeploy}
				size="lg"
				class="bg-primary text-black hover:bg-primary/90"
				disabled={isDeploying}
			>
				Deploy contract
			</Button>
		</div>
	</div>

	{#if contract && address && abi}
		<div>
			<p class="text-sm text-muted-foreground">Deployed successfully at:</p>
			<div
				class="mt-1 flex items-center gap-2 rounded-lg border bg-background px-2 py-1 dark:bg-muted"
			>
				<code class="flex-grow truncate font-mono text-sm">{address}</code>
				<CopyButton text={address} />
				<Button variant="ghost" size="icon" class="h-8 w-8" onclick={shareCode}>
					{#if isSharing}
						<Check class="size-4" />
					{:else}
						<Share2 class="size-4" />
					{/if}
				</Button>
			</div>
		</div>

		{#if variables.length > 0}
			<div class="mt-4">
				<div class="flex items-center justify-between">
					<h3 class="text-lg font-bold">Variables</h3>
					<div class="flex items-center">
						<Button variant="ghost" size="icon" class="text-muted-foreground">
							<Lock class="h-4 w-4" />
						</Button>
					</div>
				</div>
				<div class="mt-2 flex flex-wrap gap-2">
					{#each variables as variable}
						<VariableDisplay {variable} {address} {client} />
					{/each}
				</div>
			</div>
		{/if}
	{:else}
		<p>The contract has not been deployed yet.</p>
	{/if}

	<Button
		variant="ghost"
		size="icon"
		onclick={() => (isPinned = !isPinned)}
		class="absolute bottom-2 right-2"
	>
		{#if isPinned}
			<Pin class="size-4" />
		{:else}
			<PinOff class="size-4" />
		{/if}
	</Button>
</Card>
