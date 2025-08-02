<script lang="ts">
	import { getEditorState, updateEditorState } from '$lib/stores/editor.svelte';
	import { client as tevmClient } from '$lib/client';
	import type { Address } from 'viem';
	import { onMount } from 'svelte';
	import * as Select from './ui/select';
	import {
		connectWallet,
		disconnectWallet,
		getWalletState,
		supportedChains,
		switchNetwork
	} from '$lib/stores/wallet.svelte';
	import { Button } from './ui/button';

	const editorState = $derived(getEditorState());
	const wallet = $derived(getWalletState());

	const selectedTevmAccount = $derived(editorState.selectedAccount);
	const availableTevmAccounts = $derived(editorState.availableAccounts);

	let accountBalances = $state<Record<Address, string>>({});

	async function fetchAccountBalance(account: Address): Promise<string> {
		try {
			const balance = await tevmClient.getBalance({ address: account });
			return (Number(balance) / 1e18).toFixed(4);
		} catch (error) {
			console.error('Failed to fetch balance for', account, error);
			return '0.0000';
		}
	}

	async function loadAccountBalances() {
		if (availableTevmAccounts.length === 0) return;
		const balances: Record<Address, string> = {};
		for (const account of availableTevmAccounts) {
			balances[account] = await fetchAccountBalance(account);
		}
		accountBalances = balances;
	}

	function formatTevmAccountDisplay(account: Address): string {
		const balance = accountBalances[account] || '0.0000';
		const shortAddress = `${account.slice(0, 6)}...${account.slice(-4)}`;
		return `${shortAddress} (${balance} ETH)`;
	}

	function formatShortAddress(address: Address): string {
		return `${address.slice(0, 6)}...${address.slice(-4)}`;
	}

	$effect(() => {
		if (availableTevmAccounts.length > 0) {
			loadAccountBalances();
		}
	});

	onMount(() => {
		if (availableTevmAccounts.length > 0 && !selectedTevmAccount) {
			updateEditorState({ selectedAccount: availableTevmAccounts[0] });
		}
	});

	async function handleNetworkSwitch(value: string | undefined) {
		if (value) {
			await switchNetwork(parseInt(value, 10));
		}
	}
</script>

<div class="mx-4 mt-4 flex items-center gap-4">
	<div class="flex grow items-center justify-between rounded-full bg-secondary p-2 pl-6 shadow-lg">
		<div class="flex flex-grow items-center gap-6">
			{#if wallet.isConnected && wallet.address && wallet.chain}
				<span>Network</span>

				<Select.Root
					type="single"
					name="network-selector"
					value={wallet.chain.id.toString()}
					onValueChange={handleNetworkSwitch}
				>
					<Select.Trigger
						class="w-full truncate rounded-full border-none bg-accent px-4 text-accent-foreground"
					>
						{wallet.chain.name} ({formatShortAddress(wallet.address)})
					</Select.Trigger>
					<Select.Content>
						{#each Object.values(supportedChains) as chain (chain.id)}
							<Select.Item value={chain.id.toString()} label={chain.name}>
								{chain.name}
							</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>
			{:else}
				<span>Wallet</span>

				<Select.Root
					type="single"
					name="account-selector"
					value={selectedTevmAccount}
					onValueChange={(value) => {
						if (value) updateEditorState({ selectedAccount: value as Address });
					}}
				>
					<Select.Trigger
						class="w-full truncate rounded-full border-none bg-accent px-4 text-accent-foreground"
					>
						{#if selectedTevmAccount}
							{formatTevmAccountDisplay(selectedTevmAccount)}
						{:else}
							Select an account
						{/if}
					</Select.Trigger>
					<Select.Content>
						{#each availableTevmAccounts as account (account)}
							<Select.Item value={account} label={formatTevmAccountDisplay(account)}>
								{formatTevmAccountDisplay(account)}
							</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>
			{/if}
		</div>
	</div>
	{#if wallet.isConnected}
		<Button class="w-28" onclick={disconnectWallet}>Disconnect</Button>
	{:else}
		<Button class="w-28" onclick={connectWallet}>Connect</Button>
	{/if}
</div>
