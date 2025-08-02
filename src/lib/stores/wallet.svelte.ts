import {
	type Address,
	type Chain,
	type WalletClient,
	createWalletClient,
	custom,
	type PublicClient,
	createPublicClient,
	http,
	RpcRequestError,
	type EIP1193Provider
} from 'viem';
import * as allChains from 'viem/chains';
import { toast } from 'svelte-sonner';

export const supportedChains: Record<number, Chain> = {
	[allChains.sepolia.id]: allChains.sepolia,
	[allChains.hardhat.id]: allChains.hardhat,
	[allChains.localhost.id]: allChains.localhost,
	[allChains.mainnet.id]: allChains.mainnet,
	[allChains.base.id]: allChains.base,
	[allChains.optimism.id]: allChains.optimism,
	[allChains.polygon.id]: allChains.polygon,
	[allChains.arbitrum.id]: allChains.arbitrum
};

type WalletState = {
	address: Address | null;
	chain: Chain | null;
	isConnected: boolean;
	walletClient: WalletClient | null;
	publicClient: PublicClient | null;
	provider: EIP1193Provider | null;
};

const initialState: WalletState = {
	address: null,
	chain: null,
	isConnected: false,
	walletClient: null,
	publicClient: null,
	provider: null
};

let walletState = $state<WalletState>(initialState);

export const getWalletState = (): Readonly<WalletState> => walletState;

function getInjectedProvider(): EIP1193Provider | null {
	if (typeof window !== 'undefined' && typeof window.ethereum !== 'undefined') {
		return window.ethereum;
	}
	toast.error('Wallet not found', {
		description: 'Please install a wallet extension like MetaMask.'
	});
	return null;
}

async function setupWallet(provider: EIP1193Provider, accounts: Address[], chainId: number) {
	if (accounts.length === 0) {
		disconnectWallet();
		return;
	}

	const address = accounts[0];
	const chain = supportedChains[chainId];

	if (!chain) {
		toast.error('Unsupported Network', {
			description: `Please switch to a supported network.`
		});
		disconnectWallet();
		return;
	}

	const walletClient = createWalletClient({
		account: address,
		chain,
		transport: custom(provider)
	});

	const publicClient = createPublicClient({
		chain,
		transport: http()
	});

	walletState = {
		address,
		chain,
		isConnected: true,
		walletClient,
		publicClient,
		provider
	};
}

function listenToWalletEvents(provider: EIP1193Provider) {
	provider.on('accountsChanged', handleAccountsChanged as (accounts: string[]) => void);
	provider.on('chainChanged', handleChainChanged as (chainId: string) => void);
}

function stopListeningToWalletEvents() {
	const provider = walletState.provider;
	if (provider?.removeListener) {
		provider.removeListener(
			'accountsChanged',
			handleAccountsChanged as (accounts: string[]) => void
		);
		provider.removeListener('chainChanged', handleChainChanged as (chainId: string) => void);
	}
}

function handleAccountsChanged(accounts: string[]) {
	if (!walletState.provider) return;
	if (accounts.length === 0) {
		disconnectWallet();
	} else if (walletState.address !== accounts[0]) {
		setupWallet(
			walletState.provider,
			accounts as Address[],
			walletState.chain?.id ?? allChains.mainnet.id
		);
	}
}

async function handleChainChanged(chainIdHex: string) {
	if (!walletState.provider) return;
	const chainId = parseInt(chainIdHex, 16);
	if (walletState.address) {
		await setupWallet(walletState.provider, [walletState.address], chainId);
	}
}

export async function connectWallet() {
	const provider = getInjectedProvider();
	if (!provider) {
		return;
	}

	try {
		const accounts = (await provider.request({ method: 'eth_requestAccounts' })) as Address[];
		const chainIdHex = (await provider.request({ method: 'eth_chainId' })) as string;
		const chainId = parseInt(chainIdHex, 16);

		await setupWallet(provider, accounts, chainId);
		listenToWalletEvents(provider);
	} catch (error) {
		console.error('Failed to connect wallet:', error);
		toast.error('Connection failed', {
			description:
				error instanceof RpcRequestError && error.code === 4001
					? 'Connection request rejected by user.'
					: 'Could not connect to the wallet.'
		});
		disconnectWallet();
	}
}

export function disconnectWallet() {
	stopListeningToWalletEvents();
	walletState = initialState;
}

export async function switchNetwork(chainId: number) {
	if (!walletState.walletClient) {
		toast.error('Wallet not connected');
		return;
	}

	const chain = supportedChains[chainId];
	if (!chain) {
		toast.error('Unsupported network');
		return;
	}

	try {
		await walletState.walletClient.switchChain({ id: chainId });
	} catch {
		try {
			await walletState.walletClient.addChain({ chain });
		} catch (addError) {
			console.error('Failed to add chain:', addError);
			toast.error('Failed to add network', {
				description: 'The request to add the network was rejected or failed.'
			});
		}
	}
}
