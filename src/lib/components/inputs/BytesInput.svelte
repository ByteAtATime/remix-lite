<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import * as ContextMenu from '$lib/components/ui/context-menu';
	import { FileText, Hash, AlertCircle } from 'lucide-svelte';

	type Props = {
		value?: string;
		type: string;
	};

	let { value = $bindable<string | undefined>(undefined), type }: Props = $props();

	let isFixedBytes = $derived(type.match(/bytes\d+/) !== null);

	let bytesLength: number | undefined = $state(undefined);
	$effect(() => {
		if (!isFixedBytes) {
			bytesLength = undefined;
			return;
		}

		const match = type.match(/bytes(\d+)/);
		bytesLength = match ? parseInt(match[1]) : undefined;
	});

	let displayValue = $state('');
	let displayMode = $state<'hex' | 'ascii'>('hex');
	let rawHexInput = $state('');

	let currentBytesLength = $state(0);
	$effect(() => {
		if (!value) {
			currentBytesLength = 0;
			return;
		}
		const hex = value.startsWith('0x') ? value.slice(2) : value;
		currentBytesLength = Math.floor(hex.length / 2);
	});

	let lengthIsCorrect = $state(true);
	$effect(() => {
		if (!isFixedBytes || bytesLength === undefined) {
			lengthIsCorrect = true;
			return;
		}
		lengthIsCorrect = currentBytesLength === bytesLength;
	});

	let lengthWarningMessage = $state('');
	$effect(() => {
		if (!isFixedBytes || bytesLength === undefined || lengthIsCorrect) {
			lengthWarningMessage = '';
			return;
		}

		lengthWarningMessage =
			currentBytesLength < bytesLength
				? `Too short (${currentBytesLength}/${bytesLength} bytes)`
				: `Too long (${currentBytesLength}/${bytesLength} bytes)`;
	});

	$effect(() => {
		if (value === undefined) {
			displayValue = '';
			return;
		}

		const hexString = value.startsWith('0x') ? value.slice(2) : value;

		if (displayMode === 'hex') {
			displayValue = value.startsWith('0x') ? value : '0x' + value;
			rawHexInput = displayValue;
		} else {
			try {
				const bytes = new Uint8Array(
					hexString.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) || []
				);
				displayValue = new TextDecoder().decode(bytes);
			} catch {
				displayValue = '';
			}
		}
	});

	function updateValue(newDisplayValue: string) {
		const isHexInput = newDisplayValue.startsWith('0x');
		displayMode = isHexInput ? 'hex' : 'ascii';

		if (isHexInput) {
			rawHexInput = newDisplayValue;

			let hex = newDisplayValue.slice(2);
			hex = hex.replace(/[^0-9a-fA-F]/g, '');

			if (isFixedBytes && bytesLength !== undefined) {
				const maxHexChars = bytesLength * 2;
				if (hex.length > maxHexChars) {
					hex = hex.slice(0, maxHexChars);
				}
			}

			value = '0x' + hex;
		} else {
			try {
				const bytes = new TextEncoder().encode(newDisplayValue);
				let hex = Array.from(bytes)
					.map((b) => b.toString(16).padStart(2, '0'))
					.join('');

				if (isFixedBytes && bytesLength !== undefined) {
					if (bytes.length > bytesLength) {
						hex = Array.from(bytes.slice(0, bytesLength))
							.map((b) => b.toString(16).padStart(2, '0'))
							.join('');
					}
				}

				value = '0x' + hex;
			} catch {
				value = undefined;
			}
		}
	}

	function handleBlur() {
		if (displayMode === 'hex' && value) {
			let hex = value.startsWith('0x') ? value.slice(2) : value;

			if (hex.length % 2 !== 0) {
				hex = '0' + hex;
				value = '0x' + hex;
				displayValue = value;
			}
		}
	}

	function padWithZeros() {
		if (!value || !isFixedBytes || bytesLength === undefined) return;

		let hex = value.startsWith('0x') ? value.slice(2) : value;
		const targetLength = bytesLength * 2;

		if (hex.length < targetLength) {
			hex = hex.padStart(targetLength, '0');
			value = '0x' + hex;
			displayValue = value;
		}
	}

	function toggleDisplayMode() {
		displayMode = displayMode === 'hex' ? 'ascii' : 'hex';
	}
</script>

<ContextMenu.Root>
	<ContextMenu.Trigger>
		<div class="flex flex-col gap-1.5">
			<div class="relative">
				<Input
					type="text"
					bind:value={() => displayValue, updateValue}
					placeholder={`${type} (auto-detects 0x prefix for hex)`}
					onblur={handleBlur}
					class={!lengthIsCorrect ? 'border-orange-300 pr-24' : 'pr-24'}
				/>
				{#if value}
					<div class="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1.5">
						{#if !lengthIsCorrect}
							<AlertCircle class="h-3.5 w-3.5 text-orange-500" />
						{/if}
						<span class="text-xs text-muted-foreground">
							{displayMode === 'hex' ? 'HEX' : 'ASCII'}
						</span>
						<span class="rounded-sm bg-slate-100 px-1.5 py-0.5 text-xs dark:bg-slate-800">
							{currentBytesLength}
							{currentBytesLength === 1 ? 'byte' : 'bytes'}
						</span>
					</div>
				{/if}
			</div>

			{#if !lengthIsCorrect}
				<div class="flex items-center gap-2 text-xs text-orange-500">
					<AlertCircle class="h-3.5 w-3.5" />
					<span>{lengthWarningMessage}</span>
					{#if bytesLength !== undefined && currentBytesLength < bytesLength}
						<button class="ml-auto text-xs text-blue-500 hover:underline" onclick={padWithZeros}>
							Pad with zeros
						</button>
					{/if}
				</div>
			{/if}
		</div>
	</ContextMenu.Trigger>

	<ContextMenu.Content>
		<ContextMenu.Item onclick={toggleDisplayMode}>
			{#if displayMode === 'hex'}
				<FileText class="mr-1 h-4 w-4 text-muted-foreground" />
				Show as Text
			{:else}
				<Hash class="mr-1 h-4 w-4 text-muted-foreground" />
				Show as Hex
			{/if}
		</ContextMenu.Item>
		{#if isFixedBytes && bytesLength !== undefined && !lengthIsCorrect && currentBytesLength < bytesLength}
			<ContextMenu.Item onclick={padWithZeros}>
				Pad with zeros to {bytesLength} bytes
			</ContextMenu.Item>
		{/if}
	</ContextMenu.Content>
</ContextMenu.Root>
