<script lang="ts">
	import type { Component } from 'svelte';
	import AddressInput from './inputs/AddressInput.svelte';
	import UintInput from './inputs/UintInput.svelte';
	import BoolInput from './inputs/BoolInput.svelte';
	import DefaultInput from './inputs/DefaultInput.svelte';
	import ArrayInput from './inputs/ArrayInput.svelte';

	type Props = {
		type: string;
		name: string;
		value?: any;
	};

	let { type, name, value = $bindable(undefined) }: Props = $props();

	// TODO: how to avoid any here?
	const componentMap: Array<
		[RegExp, Component<{ value: any; type: string }, Record<string, never>, 'value'>]
	> = [
		[/address/, AddressInput],
		[/bool/, BoolInput],
		[/uint\d*/, UintInput],
		[/int\d*/, UintInput],
		[/string/, DefaultInput],
		[/.+\[\d*\]/, ArrayInput]
		// bytes: DefaultInput
	];

	let InputComponent = $derived(
		componentMap.find(([regex]) => type.match(regex)?.[0] === type)?.[1] ?? DefaultInput
	);
</script>

<label>
	{name} ({type})
	<InputComponent {type} bind:value />
</label>
