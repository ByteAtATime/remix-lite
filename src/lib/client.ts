import { createMemoryClient, http } from 'tevm';
import { mainnet } from 'tevm/common';
import { keccak256, encodeAbiParameters, parseAbiParameters, encodeFunctionData } from 'viem';
import type { Address, Hex } from 'viem';

export const client = createMemoryClient({
	common: mainnet,
	fork: {
		transport: http('https://eth.drpc.org')({})
	}
});

async function findBalancesSlot(tokenAddress: Address): Promise<number> {
	const account = '0x0000000000000000000000000000000000000000' as Address;
	const probeA = '0x0000000000000000000000000000000000000000000000000000000000000001';
	const probeB = '0x0000000000000000000000000000000000000000000000000000000000000002';

	for (let i = 0; i < 100; i++) {
		const probedSlot = keccak256(
			encodeAbiParameters(parseAbiParameters('address, uint256'), [account, BigInt(i)])
		);

		const prev = await client.getStorageAt({
			address: tokenAddress,
			slot: probedSlot
		});

		const probe = prev === probeA ? probeB : probeA;

		await client.setStorageAt({
			address: tokenAddress,
			index: probedSlot,
			value: probe as Hex
		});

		const result = await client.call({
			to: tokenAddress,
			data: encodeFunctionData({
				abi: [
					{
						name: 'balanceOf',
						type: 'function',
						inputs: [{ name: 'account', type: 'address' }],
						outputs: [{ name: '', type: 'uint256' }]
					}
				],
				functionName: 'balanceOf',
				args: [account]
			})
		});

		await client.setStorageAt({
			address: tokenAddress,
			index: probedSlot,
			value: prev as Hex
		});

		if (result.data) {
			const balance = BigInt(result.data);
			if (balance === BigInt(probe)) {
				return i;
			}
		}
	}

	throw new Error('Balances slot not found!');
}

export async function setTokenBalance(
	tokenAddress: Address,
	targetAddress: Address,
	amount: bigint
): Promise<void> {
	const balancesSlot = await findBalancesSlot(tokenAddress);

	const storageSlot = keccak256(
		encodeAbiParameters(parseAbiParameters('address, uint256'), [
			targetAddress,
			BigInt(balancesSlot)
		])
	);

	const encodedAmount = encodeAbiParameters(parseAbiParameters('uint256'), [amount]);

	await client.setStorageAt({
		address: tokenAddress,
		index: storageSlot,
		value: encodedAmount
	});
}

export async function getTokenBalance(
	tokenAddress: Address,
	targetAddress: Address
): Promise<bigint> {
	const result = await client.call({
		to: tokenAddress,
		data: encodeFunctionData({
			abi: [
				{
					name: 'balanceOf',
					type: 'function',
					inputs: [{ name: 'account', type: 'address' }],
					outputs: [{ name: '', type: 'uint256' }]
				}
			],
			functionName: 'balanceOf',
			args: [targetAddress]
		})
	});

	return result.data ? BigInt(result.data) : 0n;
}
