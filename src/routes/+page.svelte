<script lang="ts">
	import ReadFunctionDisplay from '$lib/components/ReadFunctionDisplay.svelte';
	import WriteFunctionDisplay from '$lib/components/WriteFunctionDisplay.svelte';
	import VariableDisplay from '$lib/components/VariableDisplay.svelte';
	import { wethContract } from '$lib/contracts';
	import { createMemoryClient, http, type AbiFunction } from 'tevm';
	import { mainnet } from 'tevm/common';

	const client = createMemoryClient({
		common: mainnet,
		miningConfig: {
			type: 'auto'
		},
		fork: {
			transport: http('https://rpc.ankr.com/eth')({})
		}
	});

	const abi = wethContract.abi;

	const contractVariables = abi.filter(
		(item): item is AbiFunction =>
			item.type === 'function' && item.stateMutability === 'view' && item.inputs.length === 0
	);

	const contractReadFunctions = abi.filter(
		(item): item is AbiFunction =>
			item.type === 'function' && item.stateMutability === 'view' && item.inputs.length !== 0
	);

	const contractWriteFunctions = abi.filter(
		(item): item is AbiFunction =>
			item.type === 'function' &&
			(item.stateMutability === 'nonpayable' || item.stateMutability === 'payable')
	);
</script>

<div class="flex flex-col gap-4 p-8">
	<div class="space-y-4">
		<h2 class="text-2xl font-bold">Contract Variables</h2>
		{#each contractVariables as variable}
			<VariableDisplay {variable} address={wethContract.address} {client} />
		{/each}
	</div>

	<div class="space-y-4">
		<h2 class="text-2xl font-bold">Read Functions</h2>
		{#each contractReadFunctions as func}
			<ReadFunctionDisplay {func} address={wethContract.address} {client} />
		{/each}
	</div>

	<div class="space-y-4">
		<h2 class="text-2xl font-bold">Write Functions</h2>
		{#each contractWriteFunctions as func}
			<WriteFunctionDisplay {func} address={wethContract.address} {client} />
		{/each}
	</div>
</div>
