<script lang="ts">
	import VariableDisplay from '$lib/components/VariableDisplay.svelte';
	import ReadFunctionDisplay from '$lib/components/ReadFunctionDisplay.svelte';
	import WriteFunctionDisplay from '$lib/components/WriteFunctionDisplay.svelte';
	import { Card } from '$lib/components/ui/card';
	import { getContract, getContractAbi, getContractAddress } from '$lib/stores/contract.svelte';
	import type { AbiFunction } from 'abitype';
	import { client } from '$lib/client';
	import MonacoEditor from '$lib/components/MonacoEditor.svelte';
	import * as Resizable from '$lib/components/ui/resizable/index.js';
	import { Button } from '$lib/components/ui/button';
	import * as Alert from '$lib/components/ui/alert';
	import { CircleX } from 'lucide-svelte';
	import { getEditorState } from '$lib/stores/editor.svelte';
	import { compileCode, deployContract } from '$lib/deploy';

	let contract = $derived(getContract());
	let abi = $derived(getContractAbi());
	let address = $derived(getContractAddress());

	const { deployerAccount, deploymentStatus, compilationError, isDeploying } =
		$derived(getEditorState());

	let variables = $derived(
		abi.filter(
			(item): item is AbiFunction =>
				item.type === 'function' &&
				(item.stateMutability === 'view' || item.stateMutability === 'pure') &&
				item.inputs.length === 0
		)
	);

	let readFunctions = $derived(
		abi.filter(
			(item): item is AbiFunction =>
				item.type === 'function' &&
				(item.stateMutability === 'view' || item.stateMutability === 'pure') &&
				item.inputs.length > 0
		)
	);

	let writeFunctions = $derived(
		abi.filter(
			(item): item is AbiFunction =>
				item.type === 'function' &&
				(item.stateMutability === 'nonpayable' || item.stateMutability === 'payable')
		)
	);

	const deploy = async () => {
		await deployContract();
	};
</script>

<Resizable.PaneGroup direction="horizontal" class="h-full w-full">
	<Resizable.Pane defaultSize={50} class="h-full">
		<MonacoEditor />
	</Resizable.Pane>
	<Resizable.Handle withHandle />
	<Resizable.Pane defaultSize={50} class="h-full">
		<div class="h-full space-y-8 overflow-y-auto p-4">
			<div class="flex w-full justify-center">
				<Button onclick={deploy} size="lg" class="w-1/3" disabled={isDeploying}>Deploy</Button>
			</div>
			<Card class="p-4">
				{#if deploymentStatus}
					<p class="text-sm text-muted-foreground">{deploymentStatus}</p>
				{/if}

				{#if compilationError}
					<Alert.Root class="mt-4">
						<CircleX class="size-4" />
						<Alert.Title>Compilation Error</Alert.Title>
						<Alert.Description>
							<pre class="whitespace-pre-wrap text-sm">{compilationError}</pre>
						</Alert.Description>
					</Alert.Root>
				{/if}
			</Card>

			{#if contract && address && abi}
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
	</Resizable.Pane>
</Resizable.PaneGroup>
