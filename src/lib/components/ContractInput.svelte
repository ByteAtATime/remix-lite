<script lang="ts">
	import type { Abi, Address } from 'abitype';
	import { Card, CardContent } from '$lib/components/ui/card';
	import { setContract } from '$lib/stores/contract.svelte';
	import { Label } from './ui/label';
	import { Input } from './ui/input';
	import { Textarea } from './ui/textarea';

	let abiText = $state('');
	let addressInput = $state('');
	let error = $state<string | null>(null);
	let currentAbi = $state<Abi | null>(null);
	let currentAddress = $state<Address | null>(null);

	function handleAbiInput(e: Event) {
		const target = e.target as HTMLTextAreaElement;
		abiText = target.value;
		try {
			const parsed = JSON.parse(abiText);
			error = null;
			currentAbi = parsed;
			updateContract();
		} catch (e) {
			console.error(e);
			error = 'Invalid ABI JSON';
			currentAbi = null;
		}
	}

	function handleAddressInput(e: Event) {
		const target = e.target as HTMLInputElement;
		addressInput = target.value;
		if (addressInput.match(/^0x[a-fA-F0-9]{40}$/)) {
			error = null;
			currentAddress = addressInput as Address;
			updateContract();
		} else {
			error = 'Invalid Ethereum address';
			currentAddress = null;
		}
	}

	function updateContract() {
		if (!currentAbi || !currentAddress) return;

		setContract({
			address: currentAddress,
			abi: currentAbi
		});
	}

	let isValid = $derived(!!currentAddress && !!currentAbi && !error);
</script>

<Card>
	<CardContent class="space-y-4">
		<div>
			<Label for="contract-address">
				Contract Address

				<Input value={addressInput} oninput={handleAddressInput} placeholder="0x..." />
			</Label>
		</div>

		<div>
			<Label for="contract-abi">
				Contract ABI

				<Textarea
					value={abiText}
					oninput={handleAbiInput}
					rows={5}
					placeholder="Paste ABI JSON here..."
				/>
			</Label>
		</div>

		{#if error}
			<div class="text-sm text-red-500">{error}</div>
		{/if}

		{#if isValid}
			<div class="text-sm text-green-500">✓ Contract configured successfully</div>
		{/if}
	</CardContent>
</Card>
