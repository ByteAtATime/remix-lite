<script lang="ts">
	import { isAddress } from 'viem';

	let {
		value = $bindable<string | undefined>(undefined),
		type
	}: {
		value?: string;
		type: string;
	} = $props();

	let isValid = $derived(value ? isAddress(value) : true);

	function handleInput(e: Event) {
		const raw = (e.target as HTMLInputElement).value.trim();
		value = raw || undefined;
	}
</script>

<input type="text" {value} oninput={handleInput} class:invalid={!isValid} placeholder="0x..." />
