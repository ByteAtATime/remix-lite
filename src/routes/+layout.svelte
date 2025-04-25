<script lang="ts">
	import '../app.css';
	import { prefundedAccounts } from 'tevm';

	let { children } = $props();

	const address = prefundedAccounts[0];
</script>

<main class="h-screen w-full">
	{@render children()}
</main>
