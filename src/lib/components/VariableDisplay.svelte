<script lang="ts">
	import type { AbiFunction } from 'abitype';
	import type { MemoryClient } from 'tevm';
	import type { Address } from 'viem';

	type Props = {
		variable: AbiFunction;
		address: Address;
		client: MemoryClient;
	};

	const { variable, address, client }: Props = $props();

	let data = $state<unknown | null>(null);

	const fetchData = async () => {
		const result = await client.tevmContract({
			abi: [variable],
			to: address,
			functionName: variable.name
		});

		data = result.data;
	};

	fetchData();

	client.watchBlockNumber({
		onBlockNumber: fetchData
	});
</script>

<div>
	<div class="flex items-center">
		<h3 class="mb-0 break-all text-lg font-medium">{variable.name}</h3>
	</div>
	<div class="text-base-content/80 flex flex-col items-start">
		<div class="block break-all bg-transparent transition">
			{data ?? 'loading...'}
		</div>
	</div>
</div>
