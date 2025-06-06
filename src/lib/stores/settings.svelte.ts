import { browser } from '$app/environment';
import { setMode } from 'mode-watcher';

export type AppSettings = {
	advancedMode: boolean;
	darkMode: boolean;
};

const defaultSettings: AppSettings = {
	advancedMode: false,
	darkMode: true
};

function loadSettings(): AppSettings {
	if (typeof localStorage === 'undefined') {
		return defaultSettings;
	}

	try {
		const saved = localStorage.getItem('remix-lite-settings');
		if (saved) {
			const parsed = JSON.parse(saved);
			return { ...defaultSettings, ...parsed };
		}
	} catch (error) {
		console.warn('Failed to load settings from localStorage:', error);
	}

	return defaultSettings;
}

function saveSettings(settings: AppSettings) {
	if (typeof localStorage === 'undefined') return;

	try {
		localStorage.setItem('remix-lite-settings', JSON.stringify(settings));
	} catch (error) {
		console.warn('Failed to save settings to localStorage:', error);
	}
}

let appSettings = $state<AppSettings>(loadSettings());

export const getAppSettings = (): Readonly<AppSettings> => appSettings;

export const updateAppSettings = (updates: Partial<AppSettings>) => {
	appSettings = { ...appSettings, ...updates };
};

export const toggleAdvancedMode = () => {
	appSettings.advancedMode = !appSettings.advancedMode;
	saveSettings(appSettings);
};

export const toggleDarkMode = () => {
	appSettings.darkMode = !appSettings.darkMode;
	if (browser) {
		setMode(appSettings.darkMode ? 'dark' : 'light');
	}
	saveSettings(appSettings);
};
