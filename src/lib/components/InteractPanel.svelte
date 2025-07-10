<script lang="ts">
	import ReadFunctionDisplay from './ReadFunctionDisplay.svelte';
	import WriteFunctionDisplay from './WriteFunctionDisplay.svelte';
	import { getContractAbi, getContractAddress } from '$lib/stores/contract.svelte';
	import type { AbiFunction } from 'abitype';
	import { client } from '$lib/client';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import * as Alert from '$lib/components/ui/alert';
	import { CircleX } from 'lucide-svelte';
	import { getEditorState, updateEditorState } from '$lib/stores/editor.svelte';
	import { deployContract, compileCode } from '$lib/deploy';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import FunctionParameters from './FunctionParameters.svelte';
	import ContractDetailsCard from './ContractDetailsCard.svelte';

	let abi = $derived(getContractAbi());
	let address = $derived(getContractAddress());

	const { compilationError } = $derived(getEditorState());

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

	let constructor = $derived(
		getEditorState().compiledAbi?.find(
			(item): item is AbiFunction => item.type === 'constructor'
		) as AbiFunction | undefined
	);

	let showConstructorDialog = $state(false);
	let constructorArgs = $state<Record<string, unknown>>({});

	const handleDeploy = async () => {
		updateEditorState({ isDeploying: true });

		let { compiledAbi } = getEditorState();

		if (!compiledAbi) {
			const compileSuccess = await compileCode();
			if (!compileSuccess) {
				updateEditorState({ isDeploying: false });
				return;
			}
			({ compiledAbi } = getEditorState());
		}

		const constructorDef = compiledAbi?.find(
			(item): item is AbiFunction => item.type === 'constructor'
		) as AbiFunction | undefined;

		if (constructorDef && constructorDef.inputs.length > 0) {
			showConstructorDialog = true;
			updateEditorState({ isDeploying: false });
		} else {
			await deployContract();
		}
	};

	const deployWithArgs = async () => {
		const args =
			constructor?.inputs.map((input, i) => constructorArgs[input.name || `param_${i}`]) || [];
		await deployContract(args);
		showConstructorDialog = false;
	};
</script>

<div class="contents h-full flex-col space-y-4 overflow-y-auto">
	<ContractDetailsCard ondeploy={handleDeploy} />

	{#if compilationError}
		<Alert.Root class="mt-4" variant="destructive">
			<CircleX class="size-4" />
			<Alert.Title>Compilation Error</Alert.Title>
			<Alert.Description>
				<pre class="whitespace-pre-wrap text-sm">{compilationError}</pre>
			</Alert.Description>
		</Alert.Root>
	{/if}

	{#if address && abi}
		{#if readFunctions.length > 0}
			<div class="space-y-4">
				{#each readFunctions as func}
					<ReadFunctionDisplay {func} {address} {client} />
				{/each}
			</div>
		{/if}

		{#if writeFunctions.length > 0}
			<div class="space-y-4">
				{#each writeFunctions as func}
					<WriteFunctionDisplay {func} {address} {client} />
				{/each}
			</div>
		{/if}
	{/if}
</div>

<Dialog.Root bind:open={showConstructorDialog}>
	<Dialog.Content class="sm:max-w-[500px]">
		<Dialog.Header>
			<Dialog.Title>Constructor Arguments</Dialog.Title>
			<Dialog.Description>Enter the arguments for the contract constructor</Dialog.Description>
		</Dialog.Header>

		{#if constructor}
			<FunctionParameters func={constructor} bind:args={constructorArgs} />
		{/if}

		<Dialog.Footer>
			<Dialog.Close class={buttonVariants({ variant: 'outline' })}>Cancel</Dialog.Close>
			<Button onclick={deployWithArgs}>Deploy Contract</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
