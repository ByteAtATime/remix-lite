<script lang="ts">
	import { Input } from '$lib/components/ui/input';

	type Props = {
		value: string;
	};

	let { value = $bindable() }: Props = $props();
</script>

<Input type="text" bind:value />
