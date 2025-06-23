<script lang="ts">
	import * as Tooltip from '$lib/components/ui/tooltip';
	import { Button } from '$lib/components/ui/button';
	import { Coins, FlaskConical } from 'lucide-svelte';
	import { getAppSettings } from '$lib/stores/settings.svelte';

	let { activeTab = $bindable() }: { activeTab: 'interact' | 'token' } = $props();

	const settings = $derived(getAppSettings());

	const menuItems = [
		{
			id: 'interact' as const,
			title: 'Interact',
			icon: FlaskConical
		},
		{
			id: 'token' as const,
			title: 'Tokens',
			icon: Coins
		}
	];

	const visibleMenuItems = $derived(
		settings.advancedMode ? menuItems : menuItems.filter((item) => item.id === 'interact')
	);
</script>

<div class="flex h-full flex-col items-center gap-2 border-l bg-background p-2">
	{#each visibleMenuItems as item (item.id)}
		<Tooltip.Root>
			<Tooltip.Trigger>
				<Button
					variant={activeTab === item.id ? 'secondary' : 'ghost'}
					size="icon"
					onclick={() => (activeTab = item.id)}
					aria-label={item.title}
				>
					<item.icon class="h-5 w-5" />
				</Button>
			</Tooltip.Trigger>
			<Tooltip.Content side="left">
				<p>{item.title}</p>
			</Tooltip.Content>
		</Tooltip.Root>
	{/each}
</div>
