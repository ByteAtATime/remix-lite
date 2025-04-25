<script lang="ts">
	import '../app.css';
	import { prefundedAccounts } from 'tevm';

	let { children } = $props();

	const address = prefundedAccounts[0];
</script>

<main class="w-full">
	{@render children()}
</main>
