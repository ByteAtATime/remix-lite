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

	type Props = {
		type: string;
		name: string;
		input?: AbiParameter;
		value?: any;
	};

	let { type, name, input, value = $bindable(undefined) }: Props = $props();

	// TODO: how to avoid any here?
	const componentMap: Array<
		[
			RegExp,
			Component<{ value: any; type: string; input?: AbiParameter }, Record<string, never>, 'value'>
		]
	> = [
		[/address/, AddressInput],
		[/bool/, BoolInput],
		[/uint\d*/, UintInput],
		[/int\d*/, UintInput],
		[/string/, DefaultInput],
		[/bytes\d*/, BytesInput],
		[/bytes/, BytesInput],
		[/.+\[\d*\]/, ArrayInput],
		[/tuple/, StructInput]
	];

	let InputComponent = $derived(
		componentMap.find(([regex]) => type.match(regex)?.[0] === type)?.[1] ?? DefaultInput
	);
</script>

<label>
	{name} ({input?.internalType ?? type})
	<InputComponent {type} {input} bind:value />
</label>
