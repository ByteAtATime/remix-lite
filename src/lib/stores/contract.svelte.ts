import type { Abi, Address } from 'abitype';

export interface Contract {
	address: Address;
	abi: Abi;
	name?: string;
}

let contract = $state<Contract | null>(null);

export function getContract() {
	return contract;
}

export function getContractAddress() {
	return contract?.address;
}

export function getContractAbi() {
	return contract?.abi ?? [];
}

export function getContractName() {
	return contract?.name;
}

export function setContract(newContract: Contract) {
	contract = newContract;
}

export function clearContract() {
	contract = null;
}
