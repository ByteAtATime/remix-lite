<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import InputDispatcher from '../InputDispatcher.svelte';
	import { Plus, Trash2 } from 'lucide-svelte';

	type Props = {
		value: unknown[];
		type: string;
	};

	let { value = $bindable(), type }: Props = $props();

	let arrayLength = $derived.by(() => {
		const match = type.match(/\[(\d+)\]/);
		return match ? parseInt(match[1]) : undefined;
	});

	$effect(() => {
		if (!Array.isArray(value)) {
			value = [];
		}

		if (arrayLength !== undefined) {
			if (value.length < arrayLength) {
				value = [...value, ...Array(arrayLength - value.length).fill(undefined)];
			} else if (value.length > arrayLength) {
				value = value.slice(0, arrayLength);
			}
		}
	});

	let elementType = $derived(type.replace(/\[\d*\]/, ''));

	function addItem() {
		if (arrayLength === undefined) {
			value = [...(value as any[]), undefined];
		}
	}

	function removeItem(index: number) {
		if (arrayLength === undefined) {
			value = (value as any[]).filter((_, i) => i !== index);
		}
	}

	function handlePaste(event: ClipboardEvent) {
		console.log('handlePaste', event);
		const pastedText = event.clipboardData?.getData('text') || '';

		if (pastedText.includes('\t') || pastedText.includes(',')) {
			event.preventDefault();

			const separator = pastedText.includes('\t') ? '\t' : ',';
			const items = pastedText.split(separator);

			if (items.length) {
				const newValues = arrayLength !== undefined ? items.slice(0, arrayLength) : items;

				value = newValues.map((item) => item.trim());
			}
		}
	}
</script>

<div class="flex flex-col gap-3 rounded-md py-2 pl-12" onpaste={handlePaste}>
	{#each value as _, index (index)}
		<div class="flex items-end gap-2">
			<div class="flex-1">
				<InputDispatcher type={elementType} name={`${index}`} bind:value={value[index]} />
			</div>
			{#if arrayLength === undefined}
				<Button variant="ghost" size="icon" onclick={() => removeItem(index)} class="flex-shrink-0">
					<Trash2 class="h-3 w-3" />
				</Button>
			{/if}
		</div>
	{/each}

	{#if arrayLength === undefined}
		<Button
			variant="outline"
			onclick={addItem}
			class="flex w-full items-center justify-center gap-2"
		>
			<Plus class="h-4 w-4" /> Add Item
		</Button>
	{/if}
</div>
