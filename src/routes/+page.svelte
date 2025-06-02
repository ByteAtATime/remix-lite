<script lang="ts">
	import MonacoEditor from '$lib/components/MonacoEditor.svelte';
	import * as Resizable from '$lib/components/ui/resizable/index.js';
	import { afterNavigate } from '$app/navigation';
	import { page } from '$app/stores';
	import { updateEditorState } from '$lib/stores/editor.svelte';
	import AppSidebar from '$lib/components/AppSidebar.svelte';
	import MainPanel from '$lib/components/MainPanel.svelte';

	let activeTab = $state<'interact' | 'token'>('interact');

	let pwaStatus = $state('Loading...');
	let cacheStatus = $state(false);

	$effect(() => {
		if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
			if (navigator.serviceWorker.controller) {
				pwaStatus = 'Service worker active';
				checkCache();
			} else {
				pwaStatus = 'Service worker registering...';
				navigator.serviceWorker.ready.then(() => {
					pwaStatus = 'Service worker ready';
					checkCache();
				});
			}
		} else {
			pwaStatus = 'Service worker not supported';
		}
	});

	async function checkCache() {
		if ('caches' in window) {
			try {
				const cache = await caches.open('remix-lite-resources-v1');
				const keys = await cache.keys();

				const hasMonaco = keys.some((request) => request.url.includes('monaco-editor'));
				const hasSolc = keys.some(
					(request) =>
						request.url.includes('soljson-v') ||
						request.url ===
							'https://binaries.soliditylang.org/bin/soljson-v0.8.29+commit.ab55807c.js'
				);

				cacheStatus = hasMonaco || hasSolc;
			} catch (e) {
				console.error('Cache check failed:', e);
				cacheStatus = false;
			}
		}
	}

	const loadCodeFromQueryParam = () => {
		if ($page.url.hash) {
			const match = $page.url.hash.match(/code=([^&]+)/);
			if (match && match[1]) {
				try {
					const decodedCode = decodeURIComponent(atob(match[1]));
					updateEditorState({ code: decodedCode });

					const newUrl = new URL(window.location.href);
					newUrl.hash = '';
					window.history.replaceState({}, '', newUrl.toString());
				} catch (error) {
					console.error('Failed to decode base64 code from URL:', error);
				}
			}
		}
	};

	afterNavigate(() => {
		loadCodeFromQueryParam();
	});
</script>

<Resizable.PaneGroup direction="horizontal" class="h-full w-full">
	<Resizable.Pane defaultSize={50} class="h-full">
		<MonacoEditor />
	</Resizable.Pane>
	<Resizable.Handle withHandle />
	<Resizable.Pane defaultSize={50} class="h-full">
		<div class="flex h-full">
			<MainPanel {activeTab} />
			<AppSidebar bind:activeTab />
		</div>
	</Resizable.Pane>
</Resizable.PaneGroup>
