import { createMemoryClient, http } from 'tevm';
import { mainnet } from 'tevm/common';

export const client = createMemoryClient({
	common: mainnet,
	fork: {
		transport: http('https://rpc.ankr.com/eth')({})
	}
});
