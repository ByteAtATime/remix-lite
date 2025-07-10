<script lang="ts">
	import { client } from '$lib/client';
	import {
		getAddress,
		isAddress,
		type Address,
		type GetEnsAvatarReturnType,
		type GetEnsNameReturnType
	} from 'viem';
	import { hardhat } from 'viem/chains';
	import BlockieAvatar from './BlockieAvatar.svelte';
	import { CheckCircle, Copy } from 'lucide-svelte';

	const {
		address,
		disableAddressLink,
		format,
		size = 'base'
	}: {
		address?: string | undefined;
		disableAddressLink?: boolean;
		format?: 'short' | 'long' | undefined;
		size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl';
	} = $props();

	const checkSumAddress = $derived(address ? getAddress(address) : undefined);

	const blockieSizeMap = {
		xs: 6,
		sm: 7,
		base: 8,
		lg: 9,
		xl: 10,
		'2xl': 12,
		'3xl': 15
	};

	let ensName: GetEnsNameReturnType | null = $state(null);
	$effect(() => {
		if (checkSumAddress)
			client.getEnsName({ address: checkSumAddress }).then((name) => (ensName = name));
	});

	let ensAvatar: GetEnsAvatarReturnType = $state(null);
	$effect(() => {
		if (ensName) client.getEnsAvatar({ name: ensName }).then((avatar) => (ensAvatar = avatar));
	});

	let addressCopied = $state(false);

	let displayAddress = $derived.by(() => {
		if (ensName) {
			return ensName;
		} else if (format === 'long') {
			return checkSumAddress;
		}
		return checkSumAddress?.slice(0, 6) + '...' + checkSumAddress?.slice(-4);
	});

	let blockExplorerAddressLink = $state<string>();
	$effect(() => {
		if (checkSumAddress) {
			// blockExplorerAddressLink = getBlockExplorerAddressLink(targetNetwork, checkSumAddress);
		}
	});
</script>

{#if !checkSumAddress}
	<div class="flex animate-pulse space-x-4">
		<div class="h-6 w-6 rounded-md bg-slate-300"></div>
		<div class="flex items-center space-y-6">
			<div class="h-2 w-28 rounded bg-slate-300"></div>
		</div>
	</div>
{:else if !isAddress(checkSumAddress)}
	<span class="text-error">Wrong address</span>
{:else}
	<div class="flex items-center">
		<div class="flex-shrink-0">
			<BlockieAvatar
				address={checkSumAddress}
				ensImage={ensAvatar}
				size={(blockieSizeMap[size] * 24) / blockieSizeMap['base']}
			/>
		</div>
		{#if disableAddressLink}
			<span class="ml-1.5 text-{size} font-normal">{displayAddress}</span>
		{:else}
			<a
				class="ml-1.5 text-{size} font-normal"
				target="_blank"
				href={blockExplorerAddressLink}
				rel="noopener noreferrer"
			>
				{displayAddress}
			</a>
		{/if}
		{#if addressCopied}
			<CheckCircle
				class="ml-1.5 h-5 w-5 cursor-pointer text-xl font-normal text-sky-600"
				aria-hidden="true"
			/>
		{:else}
			<Copy
				class="ml-1.5 h-5 w-5 cursor-pointer text-xl font-normal text-sky-600"
				aria-hidden="true"
				onclick={() => {
					navigator.clipboard.writeText(checkSumAddress);
					addressCopied = true;
					setTimeout(() => (addressCopied = false), 800);
				}}
			/>
		{/if}
	</div>
{/if}
