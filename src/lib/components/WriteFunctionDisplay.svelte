<script lang="ts">
	import type { AbiFunction } from 'abitype';
	import type { ContractResult, MemoryClient } from 'tevm';
	import type { Address } from 'viem';
	import { Card } from '$lib/components/ui/card';
	import { Alert, AlertDescription } from '$lib/components/ui/alert';
	import { Badge } from '$lib/components/ui/badge';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { XCircle, CheckCircle2, AlertCircle } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import FunctionParameters from './FunctionParameters.svelte';
	import TransactionReceipt from './TransactionReceipt.svelte';
	import { getEditorState } from '$lib/stores/editor.svelte';

	type Props = {
		func: AbiFunction;
		address: Address;
		client: MemoryClient;
	};

	let { func, address, client }: Props = $props();

	const selectedAccount = $derived(getEditorState().selectedAccount);

	let args = $state<Record<string, unknown> & { value?: bigint }>({});
	let result = $state<string[]>([]);
	let error = $state<string | null>(null);
	let isLoading = $state(false);
	let hasInteracted = $state(false);
	let txReceipt = $state<ContractResult | null>(null);

	$effect(() => {
		if (func) {
			args = Object.fromEntries(
				func.inputs.map((input, i) => [input.name || `param_${i}`, undefined])
			);
		}
	});

	const executeTransaction = async () => {
		try {
			const txReciept_ = await client.tevmContract({
				abi: [func],
				to: address,
				from: selectedAccount,
				functionName: func.name,
				args: func.inputs.map((input, i) => args[input.name || `param_${i}`]),
				value: func.stateMutability === 'payable' ? (args['value'] ?? 0n) : 0n,
				addToBlockchain: true
			});
			txReceipt = txReciept_;
			error = null;
			result = ['Transaction successful'];
		} catch (err) {
			error = err instanceof Error ? err.message : String(err);
			result = [];
			txReceipt = null;
		}
	};

	const handleWrite = async () => {
		hasInteracted = true;
		isLoading = true;
		error = null;
		result = [];
		txReceipt = null;
		await executeTransaction();
		await new Promise((resolve) => setTimeout(resolve, 500));
		isLoading = false;
	};
</script>

{#snippet loadingView()}
	<div class="space-y-2">
		<Skeleton class="h-8 w-full" />
		<Skeleton class="h-8 w-3/4" />
	</div>
{/snippet}

{#snippet errorView(error: string)}
	<Alert variant="destructive">
		<XCircle class="h-4 w-4" />
		<AlertDescription>{error}</AlertDescription>
	</Alert>
{/snippet}

{#snippet successView(txReceipt: ContractResult | null)}
	<div class="space-y-2 rounded-lg border p-4">
		<div class="mb-2 flex items-center gap-2">
			<CheckCircle2 class="h-4 w-4 text-green-500" />
			<span class="text-sm font-medium">Transaction Successful</span>
		</div>

		{#if txReceipt}
			<TransactionReceipt receipt={txReceipt} />
		{/if}
	</div>
{/snippet}

{#snippet noTransactionView()}
	<Alert>
		<AlertCircle class="h-4 w-4" />
		<AlertDescription>No transaction executed yet</AlertDescription>
	</Alert>
{/snippet}

<Card class="p-4">
	<div class="flex items-center gap-2">
		<h3 class="text-lg font-medium">{func.name}</h3>
		<Badge
			class={func.stateMutability === 'payable'
				? 'border-transparent bg-accent text-accent-foreground hover:bg-accent/80'
				: 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80'}
		>
			{func.stateMutability}
		</Badge>
	</div>

	<div class="flex flex-col">
		<FunctionParameters {func} bind:args />

		<Button onclick={handleWrite} disabled={isLoading} class="w-full">
			{#if isLoading}
				Executing...
			{:else}
				Execute
			{/if}
		</Button>
	</div>

	{#if isLoading}
		{@render loadingView()}
	{:else if error}
		{@render errorView(error)}
	{:else if result.length > 0}
		{@render successView(txReceipt)}
	{:else if hasInteracted}
		{@render noTransactionView()}
	{/if}
</Card>
