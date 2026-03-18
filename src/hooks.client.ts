// Client-side hooks for SvelteKit
// This file runs on the browser

import { getContext, setContext } from 'svelte';

/**
 * Example: Get a context value set from the root layout
 * Usage: const theme = getTheme();
 */
export function getTheme() {
	return getContext('theme');
}

/**
 * Example: Set a context value to be used by child components
 */
export function setTheme(theme: string) {
	setContext('theme', theme);
}
