<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar';
	import { FlaskConicalIcon } from 'lucide-svelte';
	import CopyButton from './CopyButton.svelte';
	import * as Avatar from './ui/avatar';
	import { blo } from 'blo';
	import type { Address } from 'viem';

	type Props = {
		address: Address;
	};

	let { address }: Props = $props();

	const items = [
		{
			title: 'Interact',
			url: '/',
			icon: FlaskConicalIcon
		}
	];
</script>

<Sidebar.Root collapsible="icon">
	<Sidebar.Header
		class="p-4 pb-0 transition-[margin,opacity] duration-200 ease-linear group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:select-none group-data-[collapsible=icon]:opacity-0"
	>
		<h1 class="whitespace-nowrap text-2xl font-bold">Remix Lite</h1>
	</Sidebar.Header>

	<Sidebar.Content>
		<Sidebar.Group>
			<Sidebar.GroupContent>
				<Sidebar.Menu>
					{#each items as item (item.title)}
						<Sidebar.MenuItem>
							<Sidebar.MenuButton>
								{#snippet child({ props })}
									<a href={item.url} {...props}>
										<item.icon />
										<span>{item.title}</span>
									</a>
								{/snippet}
							</Sidebar.MenuButton>
						</Sidebar.MenuItem>
					{/each}
				</Sidebar.Menu>
			</Sidebar.GroupContent>
		</Sidebar.Group>
	</Sidebar.Content>

	<Sidebar.Footer>
		<Sidebar.Menu>
			<Sidebar.MenuItem>
				<CopyButton text={address}>
					{#snippet child({ copy, Icon })}
						<Sidebar.MenuButton onclick={copy} size="lg">
							<Avatar.Root class="size-8 shrink-0 rounded-md">
								<Avatar.Image src={blo(address)} alt="@shadcn" />
							</Avatar.Root>

							{address.slice(0, 7)}...{address.slice(-5)}

							<Icon class="ml-auto" />
						</Sidebar.MenuButton>
					{/snippet}
				</CopyButton>
			</Sidebar.MenuItem>
		</Sidebar.Menu>
	</Sidebar.Footer>
</Sidebar.Root>
