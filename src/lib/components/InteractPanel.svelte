<script lang="ts">
	import VariableDisplay from './VariableDisplay.svelte';
	import ReadFunctionDisplay from './ReadFunctionDisplay.svelte';
	import WriteFunctionDisplay from './WriteFunctionDisplay.svelte';
	import { Card } from '$lib/components/ui/card';
	import { getContract, getContractAbi, getContractAddress } from '$lib/stores/contract.svelte';
	import type { AbiFunction } from 'abitype';
	import { client } from '$lib/client';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import * as Alert from '$lib/components/ui/alert';
	import { CircleX, Copy, Check, Share2, Lock } from 'lucide-svelte';
	import { getEditorState, updateEditorState } from '$lib/stores/editor.svelte';
	import { deployContract, compileCode } from '$lib/deploy';
	import { page } from '$app/stores';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import FunctionParameters from './FunctionParameters.svelte';
	import { toast } from 'svelte-sonner';
	import CopyButton from './CopyButton.svelte';

	let contract = $derived(getContract());
	let abi = $derived(getContractAbi());
	let address = $derived(getContractAddress());

	const { deploymentStatus, compilationError, isDeploying, compiledAbi, code } =
		$derived(getEditorState());

	let isSharing = $state(false);

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

	let constructor = $derived(
		compiledAbi?.find((item): item is AbiFunction => item.type === 'constructor') as
			| AbiFunction
			| undefined
	);

	let showConstructorDialog = $state(false);
	let constructorArgs = $state<Record<string, unknown>>({});

	const deploy = async () => {
		updateEditorState({ isDeploying: true });

		let { compiledAbi, compiledBytecode } = getEditorState();

		if (!compiledAbi || !compiledBytecode) {
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

	const shareCode = async () => {
		try {
			const encodedCode = btoa(encodeURIComponent(code));
			const url = `${window.location.origin}${window.location.pathname}#code=${encodedCode}`;
			await navigator.clipboard.writeText(url);
			isSharing = true;
			setTimeout(() => {
				isSharing = false;
			}, 2000);
			toast.success('Link Copied', { description: 'Shareable link has been copied to clipboard' });
		} catch (error) {
			console.error('Failed to create share link:', error);
			toast.error('Failed to create link', {
				description: 'Could not generate shareable link'
			});
		}
	};
</script>

<div class="flex h-full flex-col gap-4 overflow-y-auto">
	<div class="flex w-full">
		<Button
			onclick={deploy}
			size="lg"
			class="w-full bg-lime-300 text-black hover:bg-lime-400 dark:bg-lime-400 dark:hover:bg-lime-500"
			disabled={isDeploying}>Deploy contract</Button
		>
	</div>

	{#if compilationError}
		<Alert.Root class="mt-4" variant="destructive">
			<CircleX class="size-4" />
			<Alert.Title>Compilation Error</Alert.Title>
			<Alert.Description>
				<pre class="whitespace-pre-wrap text-sm">{compilationError}</pre>
			</Alert.Description>
		</Alert.Root>
	{/if}

	{#if contract && address && abi}
		<Card class="p-4">
			<h2 class="mb-4 text-xl font-bold">Contract details</h2>
			<div>
				<p class="text-sm text-muted-foreground">Deployed successfully at:</p>
				<div
					class="mt-1 flex items-center gap-2 rounded-lg border bg-background px-2 py-1 dark:bg-muted"
				>
					<code class="flex-grow truncate font-mono text-sm">{address}</code>
					<CopyButton text={address} />
					<Button variant="ghost" size="icon" class="h-8 w-8" onclick={shareCode}>
						{#if isSharing}
							<Check class="size-4" />
						{:else}
							<Share2 class="size-4" />
						{/if}
					</Button>
				</div>
			</div>

			{#if variables.length > 0}
				<div class="mt-4">
					<div class="flex items-center justify-between">
						<h3 class="text-lg font-bold">Variables</h3>
						<div class="flex items-center">
							<Button variant="ghost" size="icon" class="text-muted-foreground"
								><Lock class="h-4 w-4" /></Button
							>
						</div>
					</div>
					<div class="mt-2 flex flex-wrap gap-2">
						{#each variables as variable}
							<VariableDisplay {variable} {address} {client} />
						{/each}
					</div>
				</div>
			{/if}
		</Card>
	{/if}

	{#if contract && address && abi}
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
