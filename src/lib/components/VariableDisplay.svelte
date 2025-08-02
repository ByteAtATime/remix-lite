<script lang="ts">
	import type { AbiFunction } from 'abitype';
	import type { MemoryClient } from 'tevm';
	import { isAddress, type Address as AddressType } from 'viem';
	import { RefreshCw } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import { getEditorState } from '$lib/stores/editor.svelte';
	import Address from './Address.svelte';
	import { getWalletState } from '$lib/stores/wallet.svelte';
	import { untrack } from 'svelte';

	type Props = {
		variable: AbiFunction;
		address: AddressType;
		client: MemoryClient;
	};

	const { variable, address, client }: Props = $props();

	let data = $state<unknown | null>(null);
	let isLoading = $state(false);

	const editorState = $derived(getEditorState());
	const walletState = $derived(getWalletState());

	const fetchData = async () => {
		if (isLoading) return;
		isLoading = true;
		try {
			let resultData: unknown;

			if (walletState.isConnected && walletState.publicClient) {
				resultData = await walletState.publicClient.readContract({
					address,
					abi: [variable],
					functionName: variable.name,
					account: walletState.address ?? undefined
				});
			} else {
				const res = await client.tevmContract({
					abi: [variable],
					to: address,
					from: editorState.selectedAccount,
					functionName: variable.name
				});
				if (res.errors) {
					throw res.errors[0];
				}
				resultData = res.data;
			}
			data = resultData;
		} catch (e) {
			console.error('Failed to fetch data', e);
			data = 'Error';
		} finally {
			isLoading = false;
		}
	};

	fetchData();

	$effect(() => {
		if (walletState.isConnected && walletState.publicClient) {
			const unwatch = walletState.publicClient.watchBlockNumber({
				onBlockNumber: () => untrack(fetchData)
			});
			return () => unwatch();
		} else {
			const unwatch = client.watchBlockNumber({
				onBlockNumber: () => untrack(fetchData)
			});
			return () => unwatch();
		}
	});

	$effect(() => {
		address;
		fetchData();
	});
</script>

<div class="flex overflow-hidden rounded-md text-sm">
	<div class="flex items-center gap-2 bg-accent px-2 py-1 text-accent-foreground">
		<span>{variable.name}</span>
		<Button variant="ghost" size="icon" onclick={fetchData} disabled={isLoading} class="h-6 w-6">
			<RefreshCw class="h-3 w-3 {isLoading ? 'animate-spin' : ''}" />
		</Button>
	</div>
	<div class="flex items-center bg-white px-3 text-black">
		{#if typeof data === 'string' && isAddress(data)}
			<Address address={data} size="sm" />
		{:else}
			{data?.toString() ?? '...'}
		{/if}
	</div>
</div>
