<script lang="ts">
	import '../app.css';
	import * as Sidebar from '$lib/components/ui/sidebar';
	import AppSidebar from '$lib/components/Sidebar.svelte';
	import { prefundedAccounts } from 'tevm';

	let { children } = $props();

	const address = prefundedAccounts[0];
</script>

<Sidebar.Provider>
	<AppSidebar {address} />

	<main>
		<Sidebar.Trigger />

		{@render children()}
	</main>
</Sidebar.Provider>
