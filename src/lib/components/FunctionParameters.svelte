<script lang="ts">
	import type { AbiFunction } from 'abitype';
	import InputDispatcher from './InputDispatcher.svelte';

	type Props = {
		func: AbiFunction;
		args: Record<string, unknown> & { value?: bigint };
	};

	let { func, args = $bindable({}) }: Props = $props();
</script>

<div class="flex flex-col gap-2">
	{#each func.inputs as input, i}
		{@const paramName = input.name || `param_${i}`}
		<InputDispatcher type={input.type} name={paramName} {input} bind:value={args[paramName]} />
	{/each}
</div>
