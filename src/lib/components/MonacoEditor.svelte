<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import type * as Monaco from 'monaco-editor/esm/vs/editor/editor.api';
	import { solidityLanguageConfig, solidityTokensProvider } from '$lib/solidity';
	import { getEditorState } from '$lib/stores/editor.svelte';
	import { prefundedAccounts } from 'tevm';
	import { initCompilerWorker, cleanupWorker } from '$lib/deploy';
	import type { Address } from 'abitype';

	let editor: Monaco.editor.IStandaloneCodeEditor;
	let monaco: typeof Monaco;
	let editorContainer: HTMLElement | undefined = $state();

	const editorState = getEditorState();

	let { code = $bindable(editorState.code) } = $props();

	$effect(() => {
		code = editorState.code;
		monaco?.editor.getEditors().forEach((editor) => {
			if (editor.getModel()?.getValue() !== code) {
				editor.getModel()?.setValue(code);
			}
		});
	});

	onMount(async () => {
		if (!editorContainer) return;

		initCompilerWorker();

		try {
			const accounts = prefundedAccounts[0];
			if (accounts && accounts.length > 0) {
				editorState.deployerAccount = accounts[0] as Address;
			} else {
				console.error('No accounts found in TEVM client.');
				editorState.deploymentStatus = 'Error: No deployer accounts available in TEVM.';
			}
		} catch (error) {
			console.error('Failed to get accounts:', error);
			editorState.deploymentStatus = 'Error: Could not fetch accounts from TEVM.';
		}

		monaco = (await import('$lib/monaco')).default;

		editor = monaco.editor.create(editorContainer, {
			automaticLayout: true
		});
		monaco.languages.register({ id: 'solidity' });
		monaco.languages.setMonarchTokensProvider('solidity', solidityTokensProvider as any);
		monaco.languages.setLanguageConfiguration('solidity', solidityLanguageConfig as any);
		const model = monaco.editor.createModel(code, 'solidity');
		editor.setModel(model);
		monaco.editor.setTheme('vs-dark');
		editor.onDidChangeModelContent(() => {
			const newCode = editor.getValue();
			code = newCode;
			editorState.code = newCode;
		});
	});

	onDestroy(() => {
		monaco?.editor.getModels().forEach((model) => model.dispose());
		editor?.dispose();
		cleanupWorker();
	});
</script>

<div class="editor h-full" bind:this={editorContainer}></div>
