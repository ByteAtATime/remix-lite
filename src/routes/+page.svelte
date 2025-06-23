<script lang="ts">
	import MonacoEditor from '$lib/components/MonacoEditor.svelte';
	import * as Resizable from '$lib/components/ui/resizable/index.js';
	import { afterNavigate } from '$app/navigation';
	import { page } from '$app/state';
	import { updateEditorState } from '$lib/stores/editor.svelte';
	import AppSidebar from '$lib/components/AppSidebar.svelte';
	import MainPanel from '$lib/components/MainPanel.svelte';
	import { getAppSettings } from '$lib/stores/settings.svelte';
	import { IsMobile } from '$lib/hooks/is-mobile.svelte';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import AdvancedModeToggle from '$lib/components/AdvancedModeToggle.svelte';

	let activeTab = $state<'interact' | 'token'>('interact');

	const settings = $derived(getAppSettings());
	const isMobile = new IsMobile();

	const effectiveSettings = $derived({
		...settings,
		advancedMode: isMobile.current ? false : settings.advancedMode
	});

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
		if (page.url.hash) {
			const match = page.url.hash.match(/code=([^&]+)/);
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

{#if isMobile.current}
	<Tabs.Root class="flex h-full w-full flex-col" bind:value={activeTab}>
		<Tabs.List class="grid w-full grid-cols-2 rounded-none">
			<Tabs.Trigger value="code">Code</Tabs.Trigger>
			<Tabs.Trigger value="interact">Interact</Tabs.Trigger>
		</Tabs.List>

		<Tabs.Content value="code" class="mt-0 flex-1 overflow-hidden">
			<MonacoEditor />
		</Tabs.Content>

		<Tabs.Content value="interact" class="mt-0 flex-1 overflow-hidden">
			<MainPanel {activeTab} {effectiveSettings} />
		</Tabs.Content>
	</Tabs.Root>
{:else}
	<Resizable.PaneGroup direction="horizontal" class="h-full w-full">
		<Resizable.Pane defaultSize={50} class="h-full">
			<MonacoEditor />
		</Resizable.Pane>
		<Resizable.Handle withHandle />
		<Resizable.Pane defaultSize={50} class="h-full">
			<div class="flex h-full">
				<div class="flex-1">
					<MainPanel {activeTab} {effectiveSettings} />
				</div>
				{#if effectiveSettings.advancedMode}
					<AppSidebar bind:activeTab />
				{/if}
			</div>
		</Resizable.Pane>
	</Resizable.PaneGroup>
{/if}

<div class="fixed bottom-4 right-4 z-50">
	<AdvancedModeToggle />
</div>
