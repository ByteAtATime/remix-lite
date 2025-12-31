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
	import { parseUrlParams, fetchFromUrl, fetchFromGist } from '$lib/url-params';
	import { toast } from 'svelte-sonner';

	let activeTab = $state<'interact' | 'token'>('interact');
	let isLoadingCode = $state(false);

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

	const loadFromUrlParams = async () => {
		if (!page.url.hash) return;

		const params = parseUrlParams(page.url.hash);

		if (params.code) {
			updateEditorState({ code: params.code });
			clearUrlHash();
			return;
		}

		if (params.url) {
			isLoadingCode = true;
			const loadingToast = toast.loading('Loading code from URL...');
			try {
				const code = await fetchFromUrl(params.url);
				updateEditorState({ code });
				toast.success('Loaded code from URL', { id: loadingToast });
			} catch (error) {
				console.error('Failed to load code from URL:', error);
				toast.error('Failed to load code from URL', { id: loadingToast });
			} finally {
				isLoadingCode = false;
			}
			clearUrlHash();
			return;
		}

		if (params.gist) {
			isLoadingCode = true;
			const loadingToast = toast.loading('Loading gist...');
			try {
				const files = await fetchFromGist(params.gist);
				if (files.length > 0) {
					updateEditorState({ code: files[0].content });
					toast.success(`Loaded ${files[0].filename} from gist`, { id: loadingToast });
				}
			} catch (error) {
				console.error('Failed to load gist:', error);
				toast.error('Failed to load gist', { id: loadingToast });
			} finally {
				isLoadingCode = false;
			}
			clearUrlHash();
			return;
		}
	};

	const clearUrlHash = () => {
		const newUrl = new URL(window.location.href);
		newUrl.hash = '';
		window.history.replaceState({}, '', newUrl.toString());
	};

	afterNavigate(() => {
		loadFromUrlParams();
	});
</script>

{#if isLoadingCode}
	<div
		class="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
	>
		<div class="flex flex-col items-center gap-3">
			<div
				class="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"
			></div>
			<span class="text-sm text-muted-foreground">Loading code...</span>
		</div>
	</div>
{/if}

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
