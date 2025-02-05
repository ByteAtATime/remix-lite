<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import * as ContextMenu from '$lib/components/ui/context-menu';
	import { SquareDivide, SquareX } from 'lucide-svelte';

	type Props = {
		value?: bigint;
		type: string;
	};

	let { value = $bindable<bigint | undefined>(undefined), type }: Props = $props();

	let bits = $derived(type.match(/\d+/)?.[0] ?? '256');
	let maxValue = $derived(BigInt(2) ** BigInt(bits) - BigInt(1));
	let displayValue = $state(value?.toString() ?? '');

	function parseBigInt(val: string): bigint | undefined {
		const trimmed = val.trim();

		if (!trimmed) return undefined;

		try {
			return BigInt(trimmed);
		} catch {
			return undefined;
		}
	}

	function multiplyBy1e18(val: bigint): bigint {
		return val * BigInt(10 ** 18);
	}

	function divideBy1e18(val: bigint): bigint {
		return val / BigInt(10 ** 18);
	}

	function setValue(newValue: string) {
		displayValue = newValue;

		try {
			const parsed = parseBigInt(newValue);
			if (parsed === undefined || parsed > maxValue) {
				value = undefined;
				return;
			}
			value = parsed;
		} catch {
			value = undefined;
		}
	}
</script>

<ContextMenu.Root>
	<ContextMenu.Trigger>
		<Input type="text" bind:value={() => displayValue, setValue} placeholder={`uint${bits}`} />
	</ContextMenu.Trigger>

	<ContextMenu.Content>
		<ContextMenu.Item onclick={() => value && setValue(multiplyBy1e18(value).toString())}>
			<SquareX class="mr-1 h-4 w-4 text-muted-foreground" />
			Multiply by 1e18
		</ContextMenu.Item>

		<ContextMenu.Item onclick={() => value && setValue(divideBy1e18(value).toString())}>
			<SquareDivide class="mr-1 h-4 w-4 text-muted-foreground" />
			Divide by 1e18
		</ContextMenu.Item>
	</ContextMenu.Content>
</ContextMenu.Root>
