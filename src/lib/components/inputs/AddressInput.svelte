<script lang="ts">
	import { blo } from 'blo';
	import { isAddress } from 'viem';
	import { normalize } from 'viem/ens';
	import { createPublicClient, http } from 'viem';
	import { mainnet } from 'viem/chains';
	import { untrack } from 'svelte';
	import Skeleton from '$lib/components/ui/skeleton/skeleton.svelte';
	import * as Avatar from '$lib/components/ui/avatar';
	import * as ContextMenu from '$lib/components/ui/context-menu';
	import { ExternalLink } from 'lucide-svelte';

	type Props = {
		value: string;
		name?: string;
		placeholder?: string;
		disabled?: boolean;
	};

	let { value = $bindable(), name, placeholder, disabled }: Props = $props();
	let inputElement = $state<HTMLInputElement | null>(null);

	// State management
	let debouncedValue = $state<string>();
	let timeoutId = $state<ReturnType<typeof setTimeout>>();
	let enteredEnsName = $state<string>();
	let ensAddress = $state<string>();
	let ensName = $state<string>();
	let ensAvatar = $state<string>();
	let isLoading = $state(false);
	let error = $state(false);

	const publicClient = createPublicClient({
		chain: mainnet,
		transport: http()
	});

	// Derived states
	const isENS = $derived(value?.includes('.eth') || value?.includes('.'));
	const reFocus = $derived(error || !!ensName || !!ensAddress);

	const debounce = (func: () => void, delay: number) => {
		clearTimeout(timeoutId);
		timeoutId = setTimeout(func, delay);
	};

	// Debounce effect
	$effect(() => {
		if (isAddress(value)) {
			debouncedValue = value;
			return;
		}

		untrack(() => {
			debounce(() => {
				debouncedValue = value;
			}, 500);
		});
	});

	// Focus management
	$effect(() => {
		if (reFocus && inputElement) {
			const length = inputElement.value.length;
			inputElement.focus();
			inputElement.setSelectionRange(length, length);
		}
	});

	// ENS resolution effect
	$effect(() => {
		if (!debouncedValue) return;

		const resolveENS = async () => {
			if (!debouncedValue) return;

			try {
				isLoading = true;
				error = false;

				if (isENS) {
					const address = await publicClient.getEnsAddress({
						name: normalize(debouncedValue)
					});
					if (address) {
						ensAddress = address;
						enteredEnsName = debouncedValue;
						value = address;
					}
				} else if (isAddress(debouncedValue)) {
					const name = await publicClient.getEnsName({
						address: debouncedValue as `0x${string}`
					});
					if (name) {
						ensName = name;
						const avatar = await publicClient.getEnsAvatar({
							name: normalize(name)
						});
						ensAvatar = avatar ?? undefined;
					}
				}
			} catch {
				error = true;
			} finally {
				isLoading = false;
			}
		};

		resolveENS();
	});

	// Reset entered ENS name
	$effect(() => {
		enteredEnsName = undefined;
	});

	// UI states
	const showPrefix = $derived(!!ensName || isLoading);
	const showSuffix = $derived(!!value && !isLoading);
</script>

{#snippet inputPrefix()}
	<div class="flex items-center gap-2 rounded-l-md bg-muted pr-2">
		{#if isLoading}
			<Skeleton class="h-10 w-10 shrink-0 rounded-md" />
			<Skeleton class="h-3 w-20" />
		{:else if ensName}
			<Avatar.Root class="h-10 w-10 shrink-0 rounded-md">
				<Avatar.Image src={ensAvatar} alt="@shadcn" />
				<Avatar.Fallback>ENS</Avatar.Fallback>
			</Avatar.Root>
			<span class="text-muted-foreground">
				{enteredEnsName ?? ensName}
			</span>
		{/if}
	</div>
{/snippet}

<ContextMenu.Root>
	<ContextMenu.Trigger>
		<div class="relative w-full">
			<div
				class="flex h-10 w-full rounded-md border border-input bg-background text-base ring-offset-background md:text-sm [&:has(:focus-visible)]:outline-none [&:has(:focus-visible)]:ring-2 [&:has(:focus-visible)]:ring-ring [&:has(:focus-visible)]:ring-offset-2 [&:has([disabled])]:cursor-not-allowed [&:has([disabled])]:opacity-50"
			>
				{#if showPrefix}
					<div class="flex items-center">
						{@render inputPrefix()}
					</div>
				{/if}

				<input
					bind:this={inputElement}
					{name}
					type="text"
					bind:value
					{placeholder}
					disabled={isLoading || disabled}
					class="w-full px-2 outline-none placeholder:text-muted-foreground bg-background focus-visible:outline-none"
					class:pr-12={showSuffix}
					onfocus={() => {
						if (inputElement) {
							const length = inputElement.value.length;
							inputElement.setSelectionRange(length, length);
						}
					}}
					oninput={() => {
						ensAddress = undefined;
						ensName = undefined;
						ensAvatar = undefined;
					}}
				/>

				{#if showSuffix}
					<div class="mr-2 flex items-center">
						<img
							class="rounded-full"
							src={blo(value as `0x${string}`)}
							width="35"
							height="35"
							alt="Address identicon"
						/>
					</div>
				{/if}
			</div>
		</div>
	</ContextMenu.Trigger>
	<ContextMenu.Content>
		<ContextMenu.Item
			onclick={() => window.open(`https://etherscan.io/address/${value}`, '_blank')}
			disabled={!value || !isAddress(value)}
		>
			<ExternalLink class="mr-1 h-4 w-4 text-muted-foreground" /> Open in Etherscan
		</ContextMenu.Item>
	</ContextMenu.Content>
</ContextMenu.Root>
