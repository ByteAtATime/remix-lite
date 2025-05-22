<script lang="ts">
	import type { AbiFunction } from 'abitype';
	import type { MemoryClient } from 'tevm';
	import type { Address } from 'viem';
	import { RefreshCw } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';

	type Props = {
		variable: AbiFunction;
		address: Address;
		client: MemoryClient;
	};

	const { variable, address, client }: Props = $props();

	let data = $state<unknown | null>(null);
	let isLoading = $state(false);

	const fetchData = async () => {
		isLoading = true;
		try {
			const result = await client.tevmContract({
				abi: [variable],
				to: address,
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
</script>

<div>
	<div class="flex items-center gap-2">
		<h3 class="mb-0 break-all text-lg font-medium">{variable.name}</h3>
		<Button variant="ghost" size="icon" onclick={fetchData} disabled={isLoading} class="h-6 w-6">
			<RefreshCw class="size-3 {isLoading ? 'animate-spin' : ''}" />
		</Button>
	</div>
	<div class="text-base-content/80 flex flex-col items-start">
		<div class="block break-all bg-transparent transition">
			{data ?? 'loading...'}
		</div>
	</div>
</div>
