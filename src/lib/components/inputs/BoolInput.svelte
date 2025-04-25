<script lang="ts">
	import { Checkbox } from '$lib/components/ui/checkbox';

	type Props = {
		value: boolean;
	};

	let { value = $bindable() }: Props = $props();
</script>

<Checkbox bind:checked={() => value ?? false, (newValue) => (value = newValue)} />
