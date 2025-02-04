<script lang="ts">
	import type { AbiFunction } from 'abitype';
	import InputDispatcher from './InputDispatcher.svelte';

	type Props = {
		func: AbiFunction;
		args: Record<string, any>;
	};

	let { func, args = $bindable({}) }: Props = $props();
</script>

<div class="flex flex-col gap-2">
	{#each func.inputs as input, i}
		{@const paramName = input.name || `param_${i}`}
		<InputDispatcher type={input.type} name={paramName} bind:value={args[paramName]} />
	{/each}
</div>
