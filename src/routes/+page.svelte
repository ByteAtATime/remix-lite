<script lang="ts">
	import { wagmiContractConfig } from '$lib/contracts';
	import { createMemoryClient, http } from 'tevm';
	import { mainnet, optimism } from 'tevm/common';

	const client = createMemoryClient({
		common: mainnet,
		fork: {
			transport: http('https://rpc.ankr.com/eth')({})
		}
	});
</script>

{#await client.readContract({ ...wagmiContractConfig, functionName: 'totalSupply' })}
	<p>Loading...</p>
{:then data}
	<p>{data}</p>
{/await}
