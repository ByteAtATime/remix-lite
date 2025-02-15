<script lang="ts">
	import type { Log } from 'viem';
	import * as Card from '$lib/components/ui/card';
	import * as Accordion from '$lib/components/ui/accordion';
	import type { AbiEvent } from 'viem';
	import { wethContract } from '$lib/contracts';
	import CopyButton from '../CopyButton.svelte';

	type Props = {
		log: Log<bigint, number, boolean, AbiEvent>;
		index: number;
	};

	let { log, index }: Props = $props();
	let copySuccess = $state('');

	const truncateAddress = (address: string) => {
		return `${address.slice(0, 6)}...${address.slice(-4)}`;
	};
</script>

<Card.Root>
	<Card.Content class="py-2">
		<Accordion.Root type="single">
			<Accordion.Item value="event-log" class="border-none">
				<Accordion.Trigger>
					<div class="flex items-center gap-2">
						<span class="rounded bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
							Log #{index + 1}
						</span>
						<span class="text-sm font-medium">
							{log.eventName || 'Event Log'} - {truncateAddress(log.address)}
						</span>
					</div>
				</Accordion.Trigger>
				<Accordion.Content>
					<div class="space-y-4 [&>*]:space-y-2">
						<div>
							<div class="text-sm font-medium text-gray-500">Name</div>
							<div class="text-sm">
								<code class="font-mono">
									{log.eventName}({#each Object.keys(log.args) as key, i}
										<span>
											<span class="text-green-600"
												>{wethContract.abi
													.find(
														(e): e is AbiEvent => e.type === 'event' && e.name === log.eventName
													)
													?.inputs?.find((i) => i.name === key)?.type}</span
											>
											{key}{i < Object.keys(log.args).length - 1 ? ', ' : ''}</span
										>{/each})
								</code>
							</div>
						</div>

						<div>
							<div class="text-sm font-medium text-gray-500">Address</div>
							<div class="flex items-center gap-2">
								<code class="flex-1 rounded-lg bg-gray-50 p-2 font-mono text-sm">
									{log.address}
								</code>
								<CopyButton text={log.address} />
							</div>
						</div>

						<div>
							<span class="text-sm font-medium text-gray-500">Topics</span>
							{#each log.topics as topic}
								<div class="flex items-center justify-between">
									<code class="flex-1 rounded-lg bg-gray-50 p-2 font-mono text-sm">
										{topic}
									</code>
									<CopyButton text={topic} />
								</div>
							{/each}
						</div>

						{#if log.args}
							<div>
								<span class="text-sm font-medium text-gray-500">Parameters</span>
								{#each Object.entries(log.args) as [key, value]}
									<div class="flex items-center justify-between">
										<span class="text-sm font-medium">{key}</span>
										<code class="flex-1 rounded-lg bg-gray-50 p-2 font-mono text-sm">
											{value?.toString()}
										</code>
									</div>
								{/each}
							</div>
						{/if}

						<div>
							<span class="text-sm font-medium text-gray-500">Raw Data</span>
							<div class="flex items-center justify-between">
								<code class="flex-1 rounded-lg bg-gray-50 p-2 font-mono text-sm">
									{log.data}
								</code>
								<CopyButton text={log.data} />
							</div>
						</div>
					</div>
				</Accordion.Content>
			</Accordion.Item>
		</Accordion.Root>
	</Card.Content>
</Card.Root>

{#if copySuccess}
	<div class="mt-2 text-right text-sm text-green-500">
		{copySuccess}
	</div>
{/if}
