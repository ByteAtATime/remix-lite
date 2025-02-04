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
		try {
			console.log('test');
			const { data } = await client.tevmContract({
				abi: [func],
				to: address,
				functionName: func.name,
				args: func.inputs.map((input, i) => args[input.name || `param_${i}`])
			});

			result = Array.isArray(data) ? data : [data];
			error = null;
		} catch (err) {
			error = err instanceof Error ? err.message : String(err);
			result = [];
		} finally {
			isLoading = false;
		}
	}

	function formatValue(value: any): string {
		if (value === null || value === undefined) return 'N/A';
		if (typeof value === 'boolean') return value ? 'True' : 'False';
		if (typeof value === 'bigint') return value.toString();
		if (typeof value === 'object') return JSON.stringify(value);
		return value.toString();
	}
</script>

<Card class="p-4">
	<div class="space-y-4">
		<div class="flex items-center gap-2">
			<h3 class="text-lg font-medium">{func.name}</h3>
		</div>

		<div class="space-y-3">
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
			<Alert>
				<AlertCircle class="h-4 w-4" />
				<AlertDescription>No results to display</AlertDescription>
			</Alert>
		{/if}
	</div>
</Card>
