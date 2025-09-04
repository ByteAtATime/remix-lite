<script lang="ts">
	import type { AbiFunction } from 'abitype';
	import type { MemoryClient } from 'tevm';
	import { isAddress, type Address as AddressType } from 'viem';
	import { RefreshCw } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import { getEditorState } from '$lib/stores/editor.svelte';
	import Address from './Address.svelte';

	type Props = {
		variable: AbiFunction;
		address: AddressType;
		client: MemoryClient;
	};

	const { variable, address, client }: Props = $props();

	let data = $state<unknown | null>(null);
	let isLoading = $state(false);

	const selectedAccount = $derived(getEditorState().selectedAccount);

	const fetchData = async () => {
		isLoading = true;
		try {
			const result = await client.tevmContract({
				abi: [variable],
				to: address,
				from: selectedAccount,
				functionName: variable.name
			});
			data = result.data;
		} catch (e) {
			console.error('Failed to fetch data', e);
			data = 'Error';
		} finally {
			isLoading = false;
		}
	};

	fetchData();

	client.watchBlockNumber({
		onBlockNumber: fetchData
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
