<script lang="ts">
	import { onDestroy, onMount, untrack } from 'svelte';
	import type * as Monaco from 'monaco-editor/esm/vs/editor/editor.api';
	import { solidityLanguageConfig, solidityTokensProvider } from '$lib/solidity';
	import { getEditorState, updateEditorState } from '$lib/stores/editor.svelte';
	import { prefundedAccounts } from 'tevm';
	import { initCompilerWorker, cleanupWorker } from '$lib/deploy';
	import type { Address } from 'abitype';
	import { Button } from '$lib/components/ui/button';
	import { Share2 } from 'lucide-svelte';

	let editor: Monaco.editor.IStandaloneCodeEditor;
	let monaco: typeof Monaco;
	let editorContainer: HTMLElement | undefined = $state();
	let monacoLoaded = $state(false);

	const editorState = $derived(getEditorState());

	let { code = $bindable(editorState.code) } = $props();

	$effect(() => {
		if (!monacoLoaded) return;
		editorState;

		untrack(() => {
			code = editorState.code;
			monaco?.editor.getEditors().forEach((editor) => {
				if (editor.getModel()?.getValue() !== code) {
					editor.getModel()?.setValue(code);
				}
			});
		});
	});

	async function loadMonaco() {
		if (!editorContainer) return;

		try {
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

			editor.onDidChangeModelContent((e) => {
				const newCode = editor.getModel()?.getValue();
				code = newCode;
				updateEditorState({ code: newCode });
			});

			monacoLoaded = true;
		} catch (error) {
			console.error('Failed to load Monaco editor:', error);
		}
	}

	onMount(async () => {
		initCompilerWorker();

		try {
			const accounts = prefundedAccounts[0];
			if (accounts && accounts.length > 0) {
				updateEditorState({ deployerAccount: accounts[0] as Address });
			} else {
				console.error('No accounts found in TEVM client.');
				updateEditorState({ deploymentStatus: 'Error: No deployer accounts available in TEVM.' });
			}
		} catch (error) {
			console.error('Failed to get accounts:', error);
			updateEditorState({ deploymentStatus: 'Error: Could not fetch accounts from TEVM.' });
		}

		await loadMonaco();
	});

	onDestroy(() => {
		monaco?.editor.getModels().forEach((model) => model.dispose());
		editor?.dispose();
		cleanupWorker();
	});
</script>

<div class="editor h-full" bind:this={editorContainer}></div>
