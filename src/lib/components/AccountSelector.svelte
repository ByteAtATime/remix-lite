<script lang="ts">
	import { getEditorState, updateEditorState } from '$lib/stores/editor.svelte';
	import { client } from '$lib/client';
	import type { Address } from 'viem';
	import { onMount } from 'svelte';
	import * as Select from './ui/select';

	const editorState = $derived(getEditorState());
	const selectedAccount = $derived(editorState.selectedAccount);
	const availableAccounts = $derived(editorState.availableAccounts);

	let accountBalances = $state<Record<Address, string>>({});

	async function fetchAccountBalance(account: Address): Promise<string> {
		try {
			const balance = await client.getBalance({ address: account });
			return (Number(balance) / 1e18).toFixed(4);
		} catch (error) {
			console.error('Failed to fetch balance for', account, error);
			return '0.0000';
		}
	}

	async function loadAccountBalances() {
		if (availableAccounts.length === 0) return;

		const balances: Record<Address, string> = {};
		for (const account of availableAccounts) {
			balances[account] = await fetchAccountBalance(account);
		}
		accountBalances = balances;
	}

	function formatAccountDisplay(account: Address): string {
		const balance = accountBalances[account] || '0.0000';
		const shortAddress = `${account.slice(0, 6)}...${account.slice(-4)}`;
		return `${shortAddress} (${balance} ETH)`;
	}

	$effect(() => {
		if (availableAccounts.length > 0) {
			loadAccountBalances();
		}
	});

	onMount(() => {
		if (availableAccounts.length > 0 && !selectedAccount) {
			updateEditorState({ selectedAccount: availableAccounts[0] });
		}
	});
</script>

<div class="mx-4 mt-4 flex items-center gap-6 rounded-full bg-secondary p-2 pl-6 shadow-lg">
	Wallet

	<Select.Root
		name="account-selector"
		value={selectedAccount}
		type="single"
		onValueChange={(value) =>
			updateEditorState({ selectedAccount: value[0] as Address | undefined })}
	>
		<Select.Trigger
			class="w-full truncate rounded-full border-none bg-accent px-4 text-accent-foreground"
		>
			{selectedAccount ?? 'Select an account'}
		</Select.Trigger>
		<Select.Content>
			{#each availableAccounts as account (account)}
				<Select.Item value={account} label={formatAccountDisplay(account)}>
					{formatAccountDisplay(account)}
				</Select.Item>
			{/each}
		</Select.Content>
	</Select.Root>
</div>
