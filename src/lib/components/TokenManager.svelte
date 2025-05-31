<script lang="ts">
	import { client, setTokenBalance, getTokenBalance } from '$lib/client';
	import { encodeFunctionData } from 'viem';
	import type { Address } from 'viem';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Separator } from '$lib/components/ui/separator';
	import { toast } from 'svelte-sonner';
	import { Loader2, CheckCircle, AlertCircle, Coins, Shield } from 'lucide-svelte';
	import AddressInput from '$lib/components/inputs/AddressInput.svelte';

	let tokenAddress = $state('');
	let targetAddress = $state('0x0000000000000000000000000000000000000000');
	let tokenAmount = $state('');
	let spenderAddress = $state('');
	let approveAmount = $state('');
	let isValidating = $state(false);
	let isSettingBalance = $state(false);
	let isApproving = $state(false);
	let tokenInfo = $state<{
		name: string;
		symbol: string;
		decimals: number;
		isValid: boolean;
	} | null>(null);

	async function validateToken() {
		if (!tokenAddress || tokenAddress.length !== 42) return;

		isValidating = true;
		try {
			const nameResult = await client.call({
				to: tokenAddress as Address,
				data: encodeFunctionData({
					abi: [
						{
							name: 'name',
							type: 'function',
							inputs: [],
							outputs: [{ name: '', type: 'string' }]
						}
					],
					functionName: 'name',
					args: []
				})
			});

			const symbolResult = await client.call({
				to: tokenAddress as Address,
				data: encodeFunctionData({
					abi: [
						{
							name: 'symbol',
							type: 'function',
							inputs: [],
							outputs: [{ name: '', type: 'string' }]
						}
					],
					functionName: 'symbol',
					args: []
				})
			});

			const decimalsResult = await client.call({
				to: tokenAddress as Address,
				data: encodeFunctionData({
					abi: [
						{
							name: 'decimals',
							type: 'function',
							inputs: [],
							outputs: [{ name: '', type: 'uint8' }]
						}
					],
					functionName: 'decimals',
					args: []
				})
			});

			if (nameResult.data && symbolResult.data && decimalsResult.data) {
				let name = 'Unknown Token';
				let symbol = 'UNKNOWN';

				try {
					if (nameResult.data.length > 66) {
						const nameOffset = parseInt(nameResult.data.slice(2, 66), 16);
						const nameLength = parseInt(nameResult.data.slice(66, 130), 16);
						const nameData = nameResult.data.slice(130, 130 + nameLength * 2);
						name = new TextDecoder().decode(
							new Uint8Array(nameData.match(/.{1,2}/g)?.map((b) => parseInt(b, 16)) || [])
						);
					}
				} catch (e) {
					console.warn('Failed to decode token name');
				}

				try {
					if (symbolResult.data.length > 66) {
						const symbolOffset = parseInt(symbolResult.data.slice(2, 66), 16);
						const symbolLength = parseInt(symbolResult.data.slice(66, 130), 16);
						const symbolData = symbolResult.data.slice(130, 130 + symbolLength * 2);
						symbol = new TextDecoder().decode(
							new Uint8Array(symbolData.match(/.{1,2}/g)?.map((b) => parseInt(b, 16)) || [])
						);
					}
				} catch (e) {
					console.warn('Failed to decode token symbol');
				}

				const decimals = parseInt(decimalsResult.data, 16);

				tokenInfo = {
					name,
					symbol,
					decimals,
					isValid: true
				};

				toast.success('Token validated successfully!', {
					description: `Found ${tokenInfo.name} (${tokenInfo.symbol})`
				});
			}
		} catch (error) {
			tokenInfo = null;
			toast.error('Invalid token address', {
				description: 'This address does not appear to be a valid ERC20 token'
			});
		} finally {
			isValidating = false;
		}
	}

	async function handleSetBalance() {
		if (!tokenInfo || !targetAddress || !tokenAmount) return;

		isSettingBalance = true;
		try {
			const amountInWei = BigInt(parseFloat(tokenAmount) * Math.pow(10, tokenInfo.decimals));

			await setTokenBalance(tokenAddress as Address, targetAddress as Address, amountInWei);

			const newBalance = await getTokenBalance(tokenAddress as Address, targetAddress as Address);

			const balanceFormatted = (Number(newBalance) / Math.pow(10, tokenInfo.decimals)).toString();

			toast.success('Balance set successfully!', {
				description: `New balance: ${balanceFormatted} ${tokenInfo.symbol}`
			});
		} catch (error) {
			toast.error('Failed to set balance', {
				description: error instanceof Error ? error.message : 'Unknown error occurred'
			});
		} finally {
			isSettingBalance = false;
		}
	}

	async function handleApprove() {
		if (!tokenInfo || !spenderAddress || !approveAmount) return;

		isApproving = true;
		try {
			const amountInWei = BigInt(parseFloat(approveAmount) * Math.pow(10, tokenInfo.decimals));

			const result = await client.call({
				to: tokenAddress as Address,
				data: encodeFunctionData({
					abi: [
						{
							name: 'approve',
							type: 'function',
							inputs: [
								{ name: 'spender', type: 'address' },
								{ name: 'amount', type: 'uint256' }
							],
							outputs: [{ name: '', type: 'bool' }]
						}
					],
					functionName: 'approve',
					args: [spenderAddress as Address, amountInWei]
				})
			});

			if (result.data) {
				toast.success('Approval successful!', {
					description: `Approved ${approveAmount} ${tokenInfo.symbol} for ${spenderAddress.slice(0, 6)}...${spenderAddress.slice(-4)}`
				});
			}
		} catch (error) {
			toast.error('Failed to approve', {
				description: error instanceof Error ? error.message : 'Unknown error occurred'
			});
		} finally {
			isApproving = false;
		}
	}

	$effect(() => {
		if (tokenAddress && tokenAddress.length === 42) {
			validateToken();
		} else {
			tokenInfo = null;
		}
	});
</script>

<div class="w-full space-y-6">
	<Card class="w-full">
		<CardHeader>
			<CardTitle class="flex items-center gap-2">
				<Coins class="h-5 w-5" />
				Token Balance Manager
			</CardTitle>
			<CardDescription>Set any ERC20 token balance for any address</CardDescription>
		</CardHeader>
		<CardContent class="space-y-4">
			<div class="space-y-2">
				<Label for="token-address">Token Contract Address</Label>
				<div class="flex gap-2">
					<AddressInput
						bind:value={tokenAddress}
						placeholder="0x... or token.eth"
						name="token-address"
						class="w-full"
					/>
					{#if isValidating}
						<div class="flex items-center px-3">
							<Loader2 class="h-4 w-4 animate-spin" />
						</div>
					{:else if tokenInfo?.isValid}
						<div class="flex items-center px-3">
							<CheckCircle class="h-4 w-4 text-green-500" />
						</div>
					{:else if tokenAddress.length > 0}
						<div class="flex items-center px-3">
							<AlertCircle class="h-4 w-4 text-red-500" />
						</div>
					{/if}
				</div>
			</div>

			{#if tokenInfo?.isValid}
				<div class="rounded-lg bg-muted p-3">
					<div class="mb-2 flex items-center gap-2">
						<Badge variant="secondary">{tokenInfo.symbol}</Badge>
						<span class="text-sm font-medium">{tokenInfo.name}</span>
					</div>
					<p class="text-xs text-muted-foreground">
						Decimals: {tokenInfo.decimals}
					</p>
				</div>

				<div class="space-y-2">
					<Label for="target-address">Target Address</Label>
					<AddressInput
						bind:value={targetAddress}
						placeholder="0x... or user.eth"
						name="target-address"
					/>
				</div>

				<div class="space-y-2">
					<Label for="token-amount">Token Amount</Label>
					<Input
						id="token-amount"
						type="number"
						step="0.000001"
						placeholder="1000"
						bind:value={tokenAmount}
					/>
				</div>

				<Button
					onclick={handleSetBalance}
					disabled={!targetAddress || !tokenAmount || isSettingBalance}
					class="w-full"
				>
					{#if isSettingBalance}
						<Loader2 class="mr-2 h-4 w-4 animate-spin" />
						Setting Balance...
					{:else}
						Set Balance
					{/if}
				</Button>
			{/if}
		</CardContent>
	</Card>

	{#if tokenInfo?.isValid}
		<Card class="w-full">
			<CardHeader>
				<CardTitle class="flex items-center gap-2">
					<Shield class="h-5 w-5" />
					Token Approval
				</CardTitle>
				<CardDescription>
					Approve a spender to use tokens on behalf of the target address
				</CardDescription>
			</CardHeader>
			<CardContent class="space-y-4">
				<div class="space-y-2">
					<Label for="spender-address">Spender Address</Label>
					<AddressInput
						bind:value={spenderAddress}
						placeholder="0x... or contract.eth"
						name="spender-address"
					/>
				</div>

				<div class="space-y-2">
					<Label for="approve-amount">Approval Amount</Label>
					<Input
						id="approve-amount"
						type="number"
						step="0.000001"
						placeholder="1000"
						bind:value={approveAmount}
					/>
				</div>

				<Button
					onclick={handleApprove}
					disabled={!targetAddress || !spenderAddress || !approveAmount || isApproving}
					class="w-full"
					variant="outline"
				>
					{#if isApproving}
						<Loader2 class="mr-2 h-4 w-4 animate-spin" />
						Approving...
					{:else}
						Approve {tokenInfo.symbol}
					{/if}
				</Button>
			</CardContent>
		</Card>
	{/if}
</div>
