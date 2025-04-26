import type { Abi } from 'abitype';
import { client } from '$lib/client';
import { setContract } from '$lib/stores/contract.svelte';
import {
	getEditorState,
	compileContract,
	extractContractInfo,
	updateEditorState
} from '$lib/stores/editor.svelte';

let compilerWorker: Worker | undefined;

export function initCompilerWorker() {
	if (typeof window !== 'undefined' && !compilerWorker) {
		compilerWorker = new Worker(new URL('$lib/solc?worker', import.meta.url));
		return compilerWorker;
	}
	return compilerWorker;
}

export async function compileCode() {
	const worker = initCompilerWorker();
	if (!worker) {
		updateEditorState({ deploymentStatus: 'Error: Compiler worker not initialized' });
		return false;
	}

	const { code } = getEditorState();
	const { contractName, solidityVersion } = extractContractInfo(code);

	if (!contractName) {
		updateEditorState({
			deploymentStatus: 'Error: Could not find contract name in code',
			compilationError: 'Could not find contract name in code'
		});
		return false;
	}

	if (!solidityVersion) {
		updateEditorState({
			deploymentStatus: 'Error: Could not determine Solidity version from pragma',
			compilationError: 'Could not determine Solidity version from pragma'
		});
		return false;
	}

	try {
		updateEditorState({
			deploymentStatus: 'Compiling...',
			compilationError: null,
			isDeploying: true
		});

		const compileResult = await compileContract(worker, code);

		if (!compileResult.success || !compileResult.result.data) {
			const errorMessage = 'error' in compileResult ? compileResult.error : 'Unknown error';
			updateEditorState({
				deploymentStatus: `Compilation Error: ${errorMessage}`,
				compilationError: errorMessage as string
			});
			return false;
		}

		const solcOutput = compileResult.result.data;
		if (solcOutput.errors?.some((error) => error.severity === 'error')) {
			const error = solcOutput.errors.find((e) => e.severity === 'error');
			console.error('Compilation errors:', solcOutput.errors);
			updateEditorState({
				deploymentStatus: `Compilation Error: ${error?.message}`,
				compilationError: error?.formattedMessage || 'Unknown error'
			});
			return false;
		}

		const contractPath = 'contract.sol';
		const contractArtifact = solcOutput.contracts?.[contractPath]?.[contractName];

		if (!contractArtifact) {
			console.error('Contract artifact not found in compilation result', solcOutput);
			updateEditorState({
				deploymentStatus: 'Error: Compiled contract artifact not found',
				compilationError: 'Compiled contract artifact not found'
			});
			return false;
		}

		const abi = contractArtifact.abi as Abi;
		const bytecode = contractArtifact.evm.bytecode.object;
		const devdoc = contractArtifact.devdoc;
		const userdoc = contractArtifact.userdoc;

		if (!abi || !bytecode) {
			updateEditorState({
				deploymentStatus: 'Error: Missing ABI or bytecode in compilation result',
				compilationError: 'Missing ABI or bytecode in compilation result'
			});
			return false;
		}

		updateEditorState({
			compiledAbi: abi,
			compiledBytecode: bytecode,
			compiledDevDoc: devdoc,
			compiledUserDoc: userdoc,
			deploymentStatus: 'Compilation successful'
		});
		return true;
	} catch (error) {
		console.error('Compilation failed:', error);
		const message =
			error instanceof Error ? error.message : 'An unknown error occurred during compilation';
		updateEditorState({ deploymentStatus: `Error: ${message}`, compilationError: message });
		return false;
	}
}

export async function deployContract() {
	try {
		updateEditorState({ isDeploying: true });

		let { compiledAbi, compiledBytecode } = getEditorState();

		if (!compiledAbi || !compiledBytecode) {
			const compileSuccess = await compileCode();
			if (!compileSuccess) {
				return;
			}
			({ compiledAbi, compiledBytecode } = getEditorState());
		}

		if (!compiledAbi || !compiledBytecode) {
			updateEditorState({
				deploymentStatus: 'Error: Compilation failed, cannot deploy.'
			});
			return;
		}

		updateEditorState({ deploymentStatus: 'Deploying...' });

		const deployResult = await client.tevmDeploy({
			abi: compiledAbi,
			bytecode: `0x${compiledBytecode}`,
			addToBlockchain: true
		});

		if (deployResult.errors && deployResult.errors.length > 0) {
			console.error('Deployment errors:', deployResult.errors);
			updateEditorState({
				deploymentStatus: `Deployment Error: ${deployResult.errors[0].message}`
			});
			return;
		}

		const deployedAddress = deployResult.createdAddress;

		if (!deployedAddress) {
			console.error('Deployment failed, no address returned', deployResult);
			updateEditorState({
				deploymentStatus: 'Error: Deployment failed, no address returned'
			});
			return;
		}

		setContract({ address: deployedAddress, abi: compiledAbi });
		updateEditorState({ deploymentStatus: `Deployed successfully at: ${deployedAddress}` });
	} catch (error) {
		console.error('Deployment failed:', error);
		const message =
			error instanceof Error
				? error.message
				: typeof error === 'object' && error !== null && 'message' in error
					? String(error.message)
					: 'An unknown error occurred';
		updateEditorState({ deploymentStatus: `Error: ${message}` });
	} finally {
		updateEditorState({ isDeploying: false });
	}
}

export function cleanupWorker() {
	compilerWorker?.terminate();
	compilerWorker = undefined;
}
