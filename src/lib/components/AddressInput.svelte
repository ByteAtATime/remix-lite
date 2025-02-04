<script lang="ts">
	import { isAddress } from 'viem';
	import Input from './ui/input/input.svelte';

	let {
		value = $bindable<string | undefined>(undefined),
		type
	}: {
		value?: string;
		type: string;
	} = $props();

	let isValid = $derived(value ? isAddress(value) : true);

	function handleInput(newValue: string) {
		const raw = newValue.trim();
		value = raw || undefined;
	}
</script>

<Input type="text" bind:value={() => value ?? '', handleInput} placeholder="0x..." />
