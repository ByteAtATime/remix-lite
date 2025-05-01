import type { SolcOutput } from '@tevm/solc';

export type MessageResult =
	| {
			success: true;
			result: {
				id: string;
				data: SolcOutput;
			};
	  }
	| {
			success: false;
			result: {
				id: string;
			};
			error: unknown;
	  };

declare global {
	interface Window {
		Module: {
			cwrap: (name: string, returnType: string, args: string[]) => (...args: unknown[]) => string;
		};
	}
}

const COMPILER_URL = 'https://binaries.soliditylang.org/bin/soljson-v0.8.29+commit.ab55807c.js';

importScripts(COMPILER_URL);

onmessage = async (e) => {
	const { code, id } = e.data;

	try {
		const compile = self.Module.cwrap('solidity_compile', 'string', ['string', 'number']);
		const result = {
			data: JSON.parse(
				compile(
					JSON.stringify({
						language: 'Solidity',
						settings: {
							outputSelection: {
								'*': {
									'*': ['abi', 'evm.bytecode.object', 'devdoc', 'userdoc']
								}
							}
						},
						sources: {
							'contract.sol': {
								content: code
							}
						}
					})
				)
			),
			id
		};

		postMessage({ success: true, result } satisfies MessageResult);
	} catch (error) {
		postMessage({
			success: false,
			result: { id },
			error: error instanceof Error ? error.message : error
		} satisfies MessageResult);
	}
};
