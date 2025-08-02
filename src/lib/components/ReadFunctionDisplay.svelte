<script lang="ts">
	import type { AbiFunction } from 'abitype';
	import type { MemoryClient } from 'tevm';
	import type { Address } from 'viem';
	import { Card } from '$lib/components/ui/card';
	import { Alert, AlertDescription } from '$lib/components/ui/alert';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { XCircle, CheckCircle2, AlertCircle } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import FunctionParameters from './FunctionParameters.svelte';
	import { getEditorState } from '$lib/stores/editor.svelte';
	import { getWalletState } from '$lib/stores/wallet.svelte';

	type Props = {
		func: AbiFunction;
		address: Address;
		client: MemoryClient;
	};

	let { func, address, client }: Props = $props();

	let args = $state<Record<string, unknown> & { value?: bigint }>({});
	let result = $state<unknown[]>([]);
	let error = $state<string | null>(null);
	let isLoading = $state(false);
	let hasInteracted = $state(false);

	const editorState = $derived(getEditorState());
	const walletState = $derived(getWalletState());

	$effect(() => {
		if (func) {
			args = Object.fromEntries(
				func.inputs.map((input, i) => [input.name || `param_${i}`, undefined])
			);
		}
	});

	async function handleQuery() {
		hasInteracted = true;
		isLoading = true;
		await fetchResults();
	}

	async function fetchResults() {
		const functionArgs = func.inputs.map((input, i) => args[input.name || `param_${i}`]);
		try {
			let data: unknown;
			if (walletState.isConnected && walletState.publicClient) {
				data = await walletState.publicClient.readContract({
					address,
					abi: [func],
					functionName: func.name,
					args: functionArgs,
					account: walletState.address ?? undefined
				});
			} else {
				const res = await client.tevmContract({
					abi: [func],
					to: address,
					functionName: func.name,
					args: functionArgs,
					from: editorState.selectedAccount
				});
				if (res.errors) {
					throw res.errors[0];
				}
				data = res.data;
			}

			result = Array.isArray(data) ? data : [data];
			error = null;
		} catch (err) {
			error = err instanceof Error ? err.message : String(err);
			result = [];
		} finally {
			isLoading = false;
		}
	}

	function formatValue(value: unknown): string {
		if (value === null || value === undefined) return 'N/A';
		if (typeof value === 'boolean') return value ? 'True' : 'False';
		if (typeof value === 'bigint') return value.toString();
		if (typeof value === 'object') return JSON.stringify(value);
		return value.toString();
	}
</script>

<Card class="p-4">
	<div class="flex flex-col">
		<h3 class="text-lg font-medium">{func.name}</h3>

		<FunctionParameters {func} bind:args />

		<Button onclick={handleQuery} disabled={isLoading} class="w-full">
			{#if isLoading}
				Loading...
			{:else}
				Query
			{/if}
		</Button>
	</div>

	{#if isLoading}
		<div class="mt-4 space-y-2">
			<Skeleton class="h-8 w-full" />
			<Skeleton class="h-8 w-3/4" />
		</div>
	{:else if error}
		<Alert variant="destructive" class="mt-4">
			<XCircle class="h-4 w-4" />
			<AlertDescription>{error}</AlertDescription>
		</Alert>
	{:else if result.length > 0}
		<div class="mt-4 space-y-2 rounded-lg border p-4">
			<div class="mb-2 flex items-center gap-2">
				<CheckCircle2 class="h-4 w-4 text-green-500" />
				<span class="text-sm font-medium">Result</span>
			</div>
			{#each result as value, i}
				<div class="flex flex-col space-y-1">
					<span class="text-sm text-muted-foreground">
						{func.outputs[i]?.name || `Output ${i}`}
					</span>
					<code class="rounded bg-muted p-2 font-mono text-sm">
						{formatValue(value)}
					</code>
				</div>
			{/each}
		</div>
	{:else if hasInteracted}
		<Alert class="mt-4">
			<AlertCircle class="h-4 w-4" />
			<AlertDescription>No results to display</AlertDescription>
		</Alert>
	{/if}
</Card>
