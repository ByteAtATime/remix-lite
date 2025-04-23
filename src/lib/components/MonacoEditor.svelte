<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import type * as Monaco from 'monaco-editor/esm/vs/editor/editor.api';
	import { solidityLanguageConfig, solidityTokensProvider } from '$lib/solidity';
	import { client } from '$lib/client';
	import { setContract } from '$lib/stores/contract.svelte';
	import { Button } from '$lib/components/ui/button';
	import type { Abi, Address } from 'abitype';
	import { prefundedAccounts } from 'tevm';
	import type { MessageResult } from '$lib/solc';

	const DEFAULT_CODE = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract MyContract {
    string public message = "Hello World!";

    function updateMessage(string memory newMessage) public {
        message = newMessage;
    }
}
  `.trim();

	let editor: Monaco.editor.IStandaloneCodeEditor;
	let monaco: typeof Monaco;
	let editorContainer: HTMLElement | undefined = $state();
	let deploymentStatus = $state('');
	let deployerAccount: Address | undefined = $state();

	let compilerWorker: Worker | undefined;

	let { code = $bindable(DEFAULT_CODE) } = $props();

	function extractContractInfo(sourceCode: string): {
		contractName: string | null;
		solidityVersion: string | null;
	} {
		const contractNameMatch = sourceCode.match(/contract\s+(\w+)\s*\{/);
		const pragmaMatch = sourceCode.match(/pragma\s+solidity\s+([^;]+);/);

		const solidityVersion = pragmaMatch
			? pragmaMatch[1]
					.replace(/\^|>=|<=|>|</, '')
					.trim()
					.split('.')[1]
			: '0.8.24';

		return {
			contractName: contractNameMatch ? contractNameMatch[1] : null,
			solidityVersion: solidityVersion ? `0.${solidityVersion}` : '0.8.24'
		};
	}

	function compileWithWorker(sourceCode: string): Promise<MessageResult> {
		return new Promise((resolve, reject) => {
			if (!compilerWorker) {
				throw new Error('Compiler worker not initialized');
			}

			const messageId = crypto.randomUUID();

			const handleMessage = (event: MessageEvent) => {
				const data = event.data;

				if (data.result.id === messageId) {
					compilerWorker?.removeEventListener('message', handleMessage);

					if (data.success) {
						resolve(data);
					} else {
						reject(new Error(data.error || 'Unknown compilation error'));
					}
				}
			};

			compilerWorker.addEventListener('message', handleMessage);

			compilerWorker.postMessage({
				code: sourceCode,
				id: messageId
			});
		});
	}

	async function deployContract() {
		if (!editor || !deployerAccount) {
			deploymentStatus = 'Editor or deployer account not ready.';
			return;
		}
		deploymentStatus = 'Compiling...';
		const currentCode = editor.getValue();
		const { contractName, solidityVersion } = extractContractInfo(currentCode);

		if (!contractName) {
			deploymentStatus = 'Error: Could not find contract name in code.';
			return;
		}
		if (!solidityVersion) {
			deploymentStatus = 'Error: Could not determine Solidity version from pragma.';
			return;
		}

		try {
			const compileResult = await compileWithWorker(currentCode);

			if (!compileResult.success || !compileResult.result.data) {
				deploymentStatus = `Compilation Error: ${
					'error' in compileResult ? compileResult.error : 'Unknown error'
				}`;
				return;
			}

			const solcOutput = compileResult.result.data;
			if (solcOutput.errors?.some((error) => error.severity === 'error')) {
				const errorMsg =
					solcOutput.errors.find((e) => e.severity === 'error')?.message || 'Unknown error';
				console.error('Compilation errors:', solcOutput.errors);
				deploymentStatus = `Compilation Error: ${errorMsg}`;
				return;
			}

			const contractPath = 'contract.sol';
			const contractArtifact = solcOutput.contracts?.[contractPath]?.[contractName];

			if (!contractArtifact) {
				console.error('Contract artifact not found in compilation result', solcOutput);
				deploymentStatus = 'Error: Compiled contract artifact not found.';
				return;
			}

			const abi = contractArtifact.abi as Abi;
			const bytecode = contractArtifact.evm.bytecode.object;

			if (!abi || !bytecode) {
				deploymentStatus = 'Error: Missing ABI or bytecode in compilation result.';
				return;
			}

			deploymentStatus = 'Deploying...';
			const deployResult = await client.tevmDeploy({
				abi,
				bytecode: `0x${bytecode}`,
				addToBlockchain: true
			});

			if (deployResult.errors && deployResult.errors.length > 0) {
				console.error('Deployment errors:', deployResult.errors);
				deploymentStatus = `Deployment Error: ${deployResult.errors[0].message}`;
				return;
			}

			const deployedAddress = deployResult.createdAddress;

			if (!deployedAddress) {
				console.error('Deployment failed, no address returned', deployResult);
				deploymentStatus = 'Error: Deployment failed, no address returned.';
				return;
			}

			setContract({ address: deployedAddress, abi });
			deploymentStatus = `Deployed successfully at: ${deployedAddress}`;
			console.log(`Contract deployed at: ${deployedAddress}`);
		} catch (error: any) {
			console.error('Deployment failed:', error);
			const message = error?.error?.message || error.message || 'An unknown error occurred';
			deploymentStatus = `Error: ${message}`;
		}
	}

	onMount(async () => {
		if (!editorContainer) return;

		const SolcWorker = new Worker(new URL('$lib/solc?worker', import.meta.url));
		compilerWorker = SolcWorker;

		try {
			const accounts = prefundedAccounts[0];
			if (accounts && accounts.length > 0) {
				deployerAccount = accounts[0] as Address;
				console.log('Using deployer account:', deployerAccount);
			} else {
				console.error('No accounts found in TEVM client.');
				deploymentStatus = 'Error: No deployer accounts available in TEVM.';
			}
		} catch (error) {
			console.error('Failed to get accounts:', error);
			deploymentStatus = 'Error: Could not fetch accounts from TEVM.';
		}

		monaco = (await import('$lib/monaco')).default;

		editor = monaco.editor.create(editorContainer);
		monaco.languages.register({ id: 'solidity' });
		monaco.languages.setMonarchTokensProvider('solidity', solidityTokensProvider as any);
		monaco.languages.setLanguageConfiguration('solidity', solidityLanguageConfig as any);
		const model = monaco.editor.createModel(code, 'solidity');
		editor.setModel(model);
		monaco.editor.setTheme('vs-dark');
		editor.onDidChangeModelContent(() => {
			code = editor.getValue();
		});
	});

	onDestroy(() => {
		monaco?.editor.getModels().forEach((model) => model.dispose());
		editor?.dispose();
		compilerWorker?.terminate();
	});
</script>

<div class="editor min-h-[600px]" bind:this={editorContainer}></div>
<div class="mt-4 flex items-center gap-4">
	<Button onclick={deployContract} disabled={!deployerAccount}>Deploy Contract</Button>
	{#if !deployerAccount}<span class="text-xs text-destructive">No deployer account</span>{/if}
	{#if deploymentStatus}
		<p class="text-sm text-muted-foreground">{deploymentStatus}</p>
	{/if}
</div>
