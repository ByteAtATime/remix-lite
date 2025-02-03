<script lang="ts">
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
		(item) =>
			item.type === 'function' &&
			(item.stateMutability === 'view' || item.stateMutability === 'pure') &&
			item.inputs.length === 0
	) as AbiFunction[];

	let test = $state(0);

	client.watchBlockNumber({
		onBlockNumber: (blockNumber) => {
			console.log(blockNumber);
			test++;
		}
	});

	$effect(() => {
		setTimeout(async () => {
			const address = ('0x' + 'BAD060A7'.padStart(40, '0')) as `0x${string}`;

			client.setBalance({
				address,
				value: 5n * 10n ** 18n
			});

			await client
				.tevmContract({
					abi: wethContract.abi,
					to: wethContract.address,
					from: address,
					functionName: 'deposit',
					args: [],
					value: 10n ** 18n,
					createTransaction: true
				})
				.then(console.log)
				.catch(console.error);
		}, 5000);
	});
</script>

<div class="flex flex-col gap-4 p-8">
	{#each contractVariables as variable}
		<VariableDisplay {variable} address={wethContract.address} {client} />
	{/each}
</div>
