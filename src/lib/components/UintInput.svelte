<script lang="ts">
	let {
		value = $bindable<bigint | undefined>(undefined),
		type
	}: {
		value?: bigint;
		type: string;
	} = $props();

	let bits = $derived(type.match(/\d+/)?.[0] || '256');
	let maxValue = $derived(BigInt(2) ** BigInt(bits) - BigInt(1));
	let displayValue = $derived(value?.toString() || '');

	function handleInput(e: Event) {
		try {
			const val = (e.target as HTMLInputElement).value.trim();
			if (!val) {
				value = undefined;
				return;
			}

			const parsed = val.startsWith('0x') ? BigInt(val) : BigInt(val);
			if (parsed > maxValue) throw new Error('Value exceeds maximum');
			value = parsed;
		} catch {
			value = undefined;
		}
	}
</script>

<input type="text" value={displayValue} oninput={handleInput} placeholder={`uint${bits}`} />
