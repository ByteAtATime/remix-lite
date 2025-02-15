<script lang="ts">
	import type { Abi, Address } from 'abitype';
	import { Card, CardContent } from '$lib/components/ui/card';
	import { getContract, setContract, type Contract } from '$lib/stores/contract.svelte';

	let abiText = $state('');
	let addressInput = $state('');
	let nameInput = $state('');
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

	function handleNameInput(e: Event) {
		const target = e.target as HTMLInputElement;
		nameInput = target.value;
		updateContract();
	}

	function updateContract() {
		if (!currentAbi || !currentAddress) return;

		setContract({
			address: currentAddress,
			abi: currentAbi,
			name: nameInput || undefined
		});
	}

	let contract = $derived(getContract());
	let isValid = $derived(!!currentAddress && !!currentAbi && !error);
</script>

<Card>
	<CardContent>
		<div class="space-y-4 p-4">
			<div>
				<label for="contract-name" class="mb-1 block text-sm font-medium"
					>Contract Name (optional)</label
				>
				<input
					id="contract-name"
					type="text"
					class="w-full rounded border p-2"
					value={nameInput}
					oninput={handleNameInput}
					placeholder="My Contract"
				/>
			</div>

			<div>
				<label for="contract-address" class="mb-1 block text-sm font-medium">Contract Address</label
				>
				<input
					id="contract-address"
					type="text"
					class="w-full rounded border p-2"
					value={addressInput}
					oninput={handleAddressInput}
					placeholder="0x..."
				/>
			</div>

			<div>
				<label for="contract-abi" class="mb-1 block text-sm font-medium">Contract ABI</label>
				<textarea
					id="contract-abi"
					class="h-32 w-full rounded border p-2 font-mono text-sm"
					value={abiText}
					oninput={handleAbiInput}
					placeholder="Paste ABI JSON here..."
				/>
			</div>

			{#if error}
				<div class="text-sm text-red-500">{error}</div>
			{/if}

			{#if isValid}
				<div class="text-sm text-green-500">✓ Contract configured successfully</div>
			{/if}
		</div>
	</CardContent>
</Card>
