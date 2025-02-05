<script lang="ts">
	import AddressInput from './inputs/AddressInput.svelte';
	import UintInput from './UintInput.svelte';
	// import BoolInput from './BoolInput.svelte';
	// import DefaultInput from './DefaultInput.svelte';

	type Props = {
		type: string;
		name: string;
		value?: any;
	};

	let { type, name, value = $bindable(undefined) }: Props = $props();

	const componentMap = {
		address: AddressInput,
		// bool: BoolInput,
		uint: UintInput,
		int: UintInput
		// string: DefaultInput,
		// bytes: DefaultInput
	} as const;

	let baseType = $derived(type.replace(/[0-9]/g, ''));
	let Component = $derived(componentMap[baseType as keyof typeof componentMap] || UintInput);
</script>

<label>
	{name} ({type})
	<Component {type} bind:value />
</label>
