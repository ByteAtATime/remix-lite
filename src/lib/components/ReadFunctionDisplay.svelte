<script lang="ts">
	import InputDispatcher from './InputDispatcher.svelte';
	import type { AbiFunction } from 'abitype';
	import type { MemoryClient } from 'tevm';
	import type { Address } from 'viem';

	type Props = {
		func: AbiFunction;
		address: Address;
		client: MemoryClient;
	};

	let { func, address, client }: Props = $props();

	let values = $state<Record<string, any>>({});
	let result = $state<any[]>([]);
	let error = $state<string | null>(null);
	let isLoading = $state(false);

	$effect(() => {
		if (func) {
			values = Object.fromEntries(
				func.inputs.map((input, i) => [input.name || `param_${i}`, undefined])
			);
		}
	});

	let args = $derived(func.inputs.map((input, i) => values[input.name || `param_${i}`]));

	$effect(() => {
		isLoading = true;
		fetchResults();
	});

	async function fetchResults() {
		try {
			const { data } = await client.tevmContract({
				abi: [func],
				to: address,
				functionName: func.name,
				args
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
</script>

<div>
	<h3 class="mb-0 break-all text-lg font-medium">{func.name}</h3>

	<!-- Input Fields -->
	{#each func.inputs as input, i}
		{@const paramName = input.name || `param_${i}`}
		<InputDispatcher type={input.type} name={paramName} bind:value={values[paramName]} />
	{/each}

	<!-- Results Display -->
	{#if isLoading}
		<div class="loading">Loading...</div>
	{:else if error}
		<div class="error">{error}</div>
	{:else if result.length > 0}
		<div class="results">
			{#each result as value, i}
				<div>
					{func.outputs[i]?.name || `Output ${i}`}: {value?.toString()}
				</div>
			{/each}
		</div>
	{/if}
</div>
