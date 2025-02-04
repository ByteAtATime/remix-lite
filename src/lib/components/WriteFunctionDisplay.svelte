<script lang="ts">
	import InputDispatcher from './InputDispatcher.svelte';
	import type { AbiFunction } from 'abitype';
	import type { MemoryClient } from 'tevm';
	import type { Address } from 'viem';
	import { Card } from '$lib/components/ui/card';
	import { Alert, AlertDescription } from '$lib/components/ui/alert';
	import { Badge } from '$lib/components/ui/badge';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { XCircle, CheckCircle2, AlertCircle } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import FunctionParameters from './FunctionParameters.svelte';

	type Props = {
		func: AbiFunction;
		address: Address;
		client: MemoryClient;
	};

	let { func, address, client }: Props = $props();

	let args = $state<Record<string, any>>({});
	let result = $state<any[]>([]);
	let error = $state<string | null>(null);
	let isLoading = $state(false);
	let hasInteracted = $state(false);
	let txHash = $state<string | null>(null);

	$effect(() => {
		if (func) {
			args = Object.fromEntries(
				func.inputs.map((input, i) => [input.name || `param_${i}`, undefined])
			);
		}
	});

	async function handleWrite() {
		hasInteracted = true;
		isLoading = true;
		error = null;
		result = [];
		txHash = null;

		await executeTransaction();
	}

	async function executeTransaction() {
		try {
			const { data } = await client.tevmContract({
				abi: [func],
				to: address,
				functionName: func.name,
				args: func.inputs.map((input, i) => args[input.name || `param_${i}`]),
				value: func.stateMutability === 'payable' ? args['value'] || 0n : 0n,
				createTransaction: true
			});

			txHash = typeof data === 'string' ? data : null;
			error = null;
			result = ['Transaction successful'];
		} catch (err) {
			error = err instanceof Error ? err.message : String(err);
			result = [];
			txHash = null;
		} finally {
			isLoading = false;
		}
	}
</script>

<Card class="p-4">
	<div class="space-y-4">
		<div class="flex items-center gap-2">
			<h3 class="text-lg font-medium">{func.name}</h3>
			<Badge variant={func.stateMutability === 'payable' ? 'destructive' : 'secondary'}>
				{func.stateMutability}
			</Badge>
		</div>

		<div class="space-y-3">
			{#if func.stateMutability === 'payable'}
				<InputDispatcher type="uint256" name="value" bind:value={args['value']} />
			{/if}

			<FunctionParameters {func} bind:args />

			<Button onclick={handleWrite} disabled={isLoading} class="w-full" variant="destructive">
				{#if isLoading}
					Executing...
				{:else}
					Execute {func.name}
				{/if}
			</Button>
		</div>

		{#if isLoading}
			<div class="space-y-2">
				<Skeleton class="h-8 w-full" />
				<Skeleton class="h-8 w-3/4" />
			</div>
		{:else if error}
			<Alert variant="destructive">
				<XCircle class="h-4 w-4" />
				<AlertDescription>{error}</AlertDescription>
			</Alert>
		{:else if result.length > 0}
			<div class="space-y-2 rounded-lg border p-4">
				<div class="mb-2 flex items-center gap-2">
					<CheckCircle2 class="h-4 w-4 text-green-500" />
					<span class="text-sm font-medium">Transaction Successful</span>
				</div>
				{#if txHash}
					<div class="flex flex-col space-y-1">
						<span class="text-sm text-muted-foreground">Transaction Hash</span>
						<code class="break-all rounded bg-muted p-2 font-mono text-sm">
							{txHash}
						</code>
					</div>
				{/if}
			</div>
		{:else if hasInteracted}
			<Alert>
				<AlertCircle class="h-4 w-4" />
				<AlertDescription>No transaction executed yet</AlertDescription>
			</Alert>
		{/if}
	</div>
</Card>
