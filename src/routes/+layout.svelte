<script lang="ts">
	import '../app.css';

	let { children } = $props();
</script>

<main class="h-screen w-full">
	{@render children()}
</main>
