<script lang="ts">
	import type { Component } from 'svelte';
	import AddressInput from './inputs/AddressInput.svelte';
	import UintInput from './inputs/UintInput.svelte';
	import BoolInput from './inputs/BoolInput.svelte';
	import DefaultInput from './inputs/DefaultInput.svelte';
	import ArrayInput from './inputs/ArrayInput.svelte';
	import BytesInput from './inputs/BytesInput.svelte';
	import StructInput from './inputs/StructInput.svelte';
	import type { AbiParameter } from 'abitype';

	type InputComponentProps = {
		value: any;
		type: string;
		input?: AbiParameter;
	};

	type Props = InputComponentProps & {
		name: string;
		paramDescription?: string;
	};

	let { type, name, input, paramDescription, value = $bindable(undefined) }: Props = $props();

	type BaseInputComponent = Component<InputComponentProps, Record<string, never>, 'value'>;
	type StructInputComponent = Component<
		InputComponentProps & { input: AbiParameter & { components: readonly AbiParameter[] } },
		Record<string, never>,
		'value'
	>;

	const componentMap: Array<[RegExp, BaseInputComponent | StructInputComponent]> = [
		[/address/, AddressInput as BaseInputComponent],
		[/bool/, BoolInput as BaseInputComponent],
		[/uint\d*/, UintInput as BaseInputComponent],
		[/int\d*/, UintInput as BaseInputComponent],
		[/string/, DefaultInput as BaseInputComponent],
		[/bytes\d*/, BytesInput as BaseInputComponent],
		[/bytes/, BytesInput as BaseInputComponent],
		[/.+\[\d*\]/, ArrayInput as BaseInputComponent],
		[/tuple/, StructInput as StructInputComponent]
	];

	let InputComponent = $derived.by(() => {
		const found = componentMap.find(([regex]) => type.match(regex)?.[0] === type);
		return found ? found[1] : (DefaultInput as BaseInputComponent);
	});
</script>

<label>
	{name} ({input?.internalType ?? type})
	{#if paramDescription}
		<span class="block text-xs italic text-gray-500">{paramDescription}</span>
	{/if}

	<div class="mt-3">
		{#if InputComponent === StructInput}
			{#if input && 'components' in input}
				{#if input.components}
					<InputComponent
						{type}
						input={input as AbiParameter & { components: readonly AbiParameter[] }}
						bind:value
					/>
				{/if}
			{:else}
				<span class="text-red-500">Error: Invalid ABI for struct input.</span>
			{/if}
		{:else}
			{@const BaseComponent = InputComponent as BaseInputComponent}
			<BaseComponent {type} {input} bind:value />
		{/if}
	</div>
</label>
