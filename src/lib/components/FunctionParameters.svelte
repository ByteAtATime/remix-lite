<script lang="ts">
	import type { AbiFunction } from 'abitype';
	import InputDispatcher from './InputDispatcher.svelte';
	import { getEditorState } from '$lib/stores/editor.svelte';
	import { getAbiItemSignature } from '$lib/utils/signature';

	type Props = {
		func: AbiFunction;
		args: Record<string, unknown> & { value?: bigint };
	};

	let { func, args = $bindable({}) }: Props = $props();

	const editorState = getEditorState();
	const devdoc = $derived(editorState.compiledDevDoc);
	const userdoc = $derived(editorState.compiledUserDoc);
	const signature = $derived(getAbiItemSignature(func));
	const methodDoc = $derived(devdoc?.methods[signature]);
	const methodUserDoc = $derived(userdoc?.methods[signature]);
</script>

{#if methodUserDoc?.notice}
	<p class="mb-2 text-sm text-muted-foreground">{methodUserDoc.notice}</p>
{/if}
{#if methodDoc?.details}
	<p class="mb-2 text-sm italic text-muted-foreground">{methodDoc.details}</p>
{/if}
<div class="mb-8 mt-4 flex flex-col gap-4">
	{#if func.stateMutability === 'payable'}
		<InputDispatcher type="uint256" name="value" bind:value={args['value']} />
	{/if}

	{#each func.inputs as input, i}
		{@const paramName = input.name || `param_${i}`}
		{@const paramDescription = methodDoc?.params?.[paramName]}

		<InputDispatcher
			type={input.type}
			name={paramName}
			{input}
			bind:value={args[paramName]}
			{paramDescription}
		/>
	{/each}
</div>
