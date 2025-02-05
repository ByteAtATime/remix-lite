<script lang="ts">
	import { Input } from './ui/input';

	let {
		value = $bindable<bigint | undefined>(undefined),
		type
	}: {
		value?: bigint;
		type: string;
	} = $props();

	let bits = $derived(type.match(/\d+/)?.[0] || '256');
	let maxValue = $derived(BigInt(2) ** BigInt(bits) - BigInt(1));
	let displayValue = $state(value?.toString() || '');

	function setValue(newValue: string) {
		displayValue = newValue;

		try {
			const val = newValue.trim();
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

<Input type="text" bind:value={() => displayValue ?? '', setValue} placeholder={`uint${bits}`} />
