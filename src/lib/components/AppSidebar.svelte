<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import { Coins, FlaskConical } from 'lucide-svelte';

	let { activeTab = $bindable() }: { activeTab: 'interact' | 'token' } = $props();

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

	const sidebar = Sidebar.useSidebar();
	sidebar.props.setOpen(false);
	$effect(() => {
		sidebar.state = 'collapsed';
	});
</script>

<Sidebar.Root side="right" collapsible="icon" class="border-l">
	<Sidebar.Content>
		<Sidebar.Group>
			<Sidebar.GroupContent>
				<Sidebar.Menu>
					{#each menuItems as item (item.id)}
						<Sidebar.MenuItem>
							<Tooltip.Root>
								<Tooltip.Trigger>
									{#snippet child({ props })}
										<Sidebar.MenuButton
											{...props}
											data-active={activeTab === item.id}
											onclick={() => (activeTab = item.id)}
										>
											<item.icon class="h-4 w-4" />
											<span>{item.title}</span>
										</Sidebar.MenuButton>
									{/snippet}
								</Tooltip.Trigger>
								<Tooltip.Content side="left">
									<p>{item.title}</p>
								</Tooltip.Content>
							</Tooltip.Root>
						</Sidebar.MenuItem>
					{/each}
				</Sidebar.Menu>
			</Sidebar.GroupContent>
		</Sidebar.Group>
	</Sidebar.Content>
</Sidebar.Root>
