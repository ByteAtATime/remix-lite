<script lang="ts">
	import type { ContractResult } from 'tevm';
	import EventLog from './events/EventLog.svelte';
	import { parseEventLogs, type Log, type TransactionReceipt as ViemReceipt } from 'viem';
	import { getContractAbi } from '$lib/stores/contract.svelte';
	import * as Card from '$lib/components/ui/card';
	import { Alert, AlertDescription } from './ui/alert';
	import { AlertCircle } from 'lucide-svelte';

	type Props = {
		receipt: ContractResult | ViemReceipt;
	};

	let { receipt }: Props = $props();
	let abi = $derived(getContractAbi());

	const isTevmReceipt = 'executionGasUsed' in receipt;

	const gasUsed = isTevmReceipt ? receipt.executionGasUsed : receipt.gasUsed;
	const totalGasSpent = isTevmReceipt
		? receipt.totalGasSpent
		: receipt.gasUsed * (receipt.effectiveGasPrice ?? 0n);
	const gasLimit = isTevmReceipt ? receipt.gas : undefined;

	const logs = $derived(
		parseEventLogs({
			abi,
			logs: (receipt.logs ?? []) as Log[]
		})
	);
</script>

<div class="mb-4 w-full">
	<div class="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
		<Card.Root>
			<Card.Header>
				<Card.Title class="text-xl">Gas Used</Card.Title>
			</Card.Header>
			<Card.Content class="pt-4">
				<p class="text-lg font-semibold">{gasUsed.toLocaleString()}</p>
				<Card.Description>Actual gas consumed</Card.Description>
			</Card.Content>
		</Card.Root>
		<Card.Root>
			<Card.Header>
				<Card.Title class="text-xl">Total Gas Spent</Card.Title>
			</Card.Header>
			<Card.Content class="pt-4">
				<p class="text-lg font-semibold">{totalGasSpent?.toLocaleString()}</p>
				<Card.Description>Including unused gas</Card.Description>
			</Card.Content>
		</Card.Root>
		<Card.Root>
			<Card.Header>
				<Card.Title class="text-xl">Gas Limit</Card.Title>
			</Card.Header>
			<Card.Content class="pt-4">
				{#if gasLimit}
					<p class="text-lg font-semibold">{gasLimit.toLocaleString()}</p>
					<Card.Description>Maximum allowed gas</Card.Description>
				{:else}
					<p class="text-lg font-semibold">-</p>
					<Card.Description>Not available</Card.Description>
				{/if}
			</Card.Content>
		</Card.Root>
	</div>

	<h3 class="mb-2 text-sm font-medium">Events</h3>

	{#each logs as log, i}
		<EventLog {log} index={i} />
	{:else}
		<Alert>
			<AlertCircle class="h-4 w-4" />
			<AlertDescription>No events emitted</AlertDescription>
		</Alert>
	{/each}
</div>
