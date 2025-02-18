<script lang="ts">
	import ContractInput from '$lib/components/ContractInput.svelte';
	import VariableDisplay from '$lib/components/VariableDisplay.svelte';
	import ReadFunctionDisplay from '$lib/components/ReadFunctionDisplay.svelte';
	import WriteFunctionDisplay from '$lib/components/WriteFunctionDisplay.svelte';
	import { Card } from '$lib/components/ui/card';
	import { getContract, getContractAbi, getContractAddress } from '$lib/stores/contract.svelte';
	import type { AbiFunction } from 'abitype';
	import { client } from '$lib/client';

	let contract = $derived(getContract());
	let abi = $derived(getContractAbi());
	let address = $derived(getContractAddress());

	let variables = $derived(
		abi.filter(
			(item): item is AbiFunction =>
				item.type === 'function' && item.stateMutability === 'view' && item.inputs.length === 0
		)
	);

	let readFunctions = $derived(
		abi.filter(
			(item): item is AbiFunction =>
				item.type === 'function' && item.stateMutability === 'view' && item.inputs.length > 0
		)
	);

	let writeFunctions = $derived(
		abi.filter(
			(item): item is AbiFunction =>
				item.type === 'function' &&
				(item.stateMutability === 'nonpayable' || item.stateMutability === 'payable')
		)
	);
</script>

<div class="container mx-auto space-y-8 p-4">
	<ContractInput />

	{#if contract}
		{#if variables.length > 0}
			<Card class="p-4">
				<h2 class="mb-4 text-xl font-bold">Variables</h2>
				<div class="space-y-4">
					{#each variables as variable}
						<VariableDisplay {variable} {address} {client} />
					{/each}
				</div>
			</Card>
		{/if}

		{#if readFunctions.length > 0}
			<div>
				<h2 class="text-xl font-bold">Read Functions</h2>
				<div class="space-y-4">
					{#each readFunctions as func}
						<ReadFunctionDisplay {func} {address} {client} />
					{/each}
				</div>
			</div>
		{/if}

		{#if writeFunctions.length > 0}
			<div>
				<h2 class="text-xl font-bold">Write Functions</h2>
				<div class="space-y-4">
					{#each writeFunctions as func}
						<WriteFunctionDisplay {func} {address} {client} />
					{/each}
				</div>
			</div>
		{/if}
	{/if}
</div>
