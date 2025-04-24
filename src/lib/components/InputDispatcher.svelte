<script lang="ts">
	import type { Component } from 'svelte';
	import AddressInput from './inputs/AddressInput.svelte';
	import UintInput from './inputs/UintInput.svelte';
	// import BoolInput from './BoolInput.svelte';
	import DefaultInput from './inputs/DefaultInput.svelte';

	type Props = {
		type: string;
		name: string;
		value?: unknown;
	};

	let { type, name, value = $bindable(undefined) }: Props = $props();

	const componentMap = {
		address: AddressInput,
		// bool: BoolInput,
		uint: UintInput,
		int: UintInput,
		string: DefaultInput
		// bytes: DefaultInput
	} as Record<string, Component<{ value: unknown; type: string }, Record<string, never>, 'value'>>;
	// TODO: is this the best type?

	let baseType = $derived(type.replace(/[0-9]/g, ''));
	let InputComponent = $derived(
		componentMap[baseType as keyof typeof componentMap] || DefaultInput
	);
</script>

<label>
	{name} ({type})
	<InputComponent {type} bind:value />
</label>
