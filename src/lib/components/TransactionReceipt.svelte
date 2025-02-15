<script lang="ts">
	import type { ContractResult } from 'tevm';
	import EventLog from './events/EventLog.svelte';
	import { parseEventLogs, type Log } from 'viem';
	import { getContractAbi } from '$lib/stores/contract.svelte';

	type Props = {
		receipt: ContractResult;
	};

	let { receipt }: Props = $props();
	let abi = $derived(getContractAbi());

	const logs = $derived(
		parseEventLogs({
			abi,
			logs: (receipt.logs ?? []) as Log[]
		})
	);
</script>

<div class="mb-4 w-full">
	<div class="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
		<div class="rounded-lg bg-gray-50 p-4">
			<h3 class="mb-1 text-sm font-medium text-gray-500">Gas Used</h3>
			<p class="text-lg font-semibold">{receipt.executionGasUsed.toLocaleString()}</p>
			<p class="text-xs text-gray-500">Actual gas consumed</p>
		</div>
		<div class="rounded-lg bg-gray-50 p-4">
			<h3 class="mb-1 text-sm font-medium text-gray-500">Total Gas Spent</h3>
			<p class="text-lg font-semibold">{receipt.totalGasSpent?.toLocaleString()}</p>
			<p class="text-xs text-gray-500">Including unused gas</p>
		</div>
		<div class="rounded-lg bg-gray-50 p-4">
			<h3 class="mb-1 text-sm font-medium text-gray-500">Gas Limit</h3>
			<p class="text-lg font-semibold">{receipt.gas?.toLocaleString()}</p>
			<p class="text-xs text-gray-500">Maximum allowed gas</p>
		</div>
	</div>

	<h3 class="mb-2 text-sm font-medium">Events</h3>

	{#each logs as log, i}
		<EventLog {log} index={i} />
	{/each}
</div>
