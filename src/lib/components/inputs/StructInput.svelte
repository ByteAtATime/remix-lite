<script lang="ts">
	import InputDispatcher from '$lib/components/InputDispatcher.svelte';
	import type { AbiParameter, SolidityArrayWithTuple, SolidityTuple } from 'abitype';

	type Props = {
		value?: Record<string, any>;
		input?: Extract<AbiParameter, { type: SolidityTuple | SolidityArrayWithTuple }>;
	};

	let { input, value = $bindable() }: Props = $props();

	$effect(() => {
		let updated = false;
		const newValue = { ...(value ?? {}) };
		for (const component of input?.components ?? []) {
			if (component.name && !(component.name in newValue)) {
				newValue[component.name] = undefined;
				updated = true;
			}
		}
		if (updated) {
			value = newValue;
		}
	});
</script>

<div class="flex flex-col gap-3 py-2 pl-12">
	{#each input?.components ?? [] as component (component.name)}
		{#if component.name}
			<InputDispatcher
				type={component.type}
				name={component.name}
				input={component}
				bind:value={
					() => value?.[component.name!],
					(newValue) => {
						if (!value) value = {};
						value[component.name!] = newValue;
					}
				}
			/>
		{/if}
	{/each}
</div>
