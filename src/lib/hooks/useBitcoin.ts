/**
 * Custom hooks for reusable frontend logic
 */

import { onMount } from 'svelte';
import { bitcoinStore, setBitcoinLoading, setBitcoinError } from '$lib/stores';
import { getBitcoinData } from '$lib/api';

/**
 * Hook to fetch and manage Bitcoin data
 * @example
 * const { data, loading, error } = useBitcoin();
 */
export function useBitcoin() {
	const { subscribe } = bitcoinStore;
	let isMounted = false;

	async function fetchData() {
		setBitcoinLoading(true);
		const response = await getBitcoinData();

		if (response.success && response.data) {
			const { price, change24h, marketCap } = response.data;
			// Update store with fetched data
		} else {
			setBitcoinError(response.error || 'Failed to fetch Bitcoin data');
		}

		setBitcoinLoading(false);
	}

	onMount(() => {
		isMounted = true;
		fetchData();

		// Optional: Set up polling (e.g., refresh every 30 seconds)
		const interval = setInterval(fetchData, 30000);

		return () => {
			isMounted = false;
			clearInterval(interval);
		};
	});

	return {
		subscribe,
		refetch: fetchData
	};
}

/**
 * Hook for managing window resize events
 */
export function useWindowSize() {
	let width: number;
	let height: number;

	function handleResize() {
		if (typeof window !== 'undefined') {
			width = window.innerWidth;
			height = window.innerHeight;
		}
	}

	onMount(() => {
		handleResize();
		window.addEventListener('resize', handleResize);

		return () => {
			window.removeEventListener('resize', handleResize);
		};
	});

	return {
		get width() {
			return width;
		},
		get height() {
			return height;
		}
	};
}

/**
 * Hook for managing theme persistence
 */
export function useTheme() {
	import('$lib/stores').then(({ themeStore, toggleTheme }) => {
		const savedTheme = typeof localStorage !== 'undefined' ? localStorage.getItem('theme') : null;

		if (savedTheme) {
			// Apply saved theme
		}

		return {
			subscribe: themeStore.subscribe,
			toggle: toggleTheme
		};
	});
}
