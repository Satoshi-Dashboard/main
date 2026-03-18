/**
 * Global state management using Svelte stores
 */

import { writable } from 'svelte/store';

// ===== Bitcoin Store =====
interface BitcoinState {
	price: number;
	change24h: number;
	marketCap: number;
	loading: boolean;
	error: string | null;
}

const initialBitcoinState: BitcoinState = {
	price: 0,
	change24h: 0,
	marketCap: 0,
	loading: false,
	error: null
};

export const bitcoinStore = writable<BitcoinState>(initialBitcoinState);

export function setBitcoinPrice(price: number, change24h: number) {
	bitcoinStore.update((state) => ({
		...state,
		price,
		change24h
	}));
}

export function setBitcoinLoading(loading: boolean) {
	bitcoinStore.update((state) => ({
		...state,
		loading
	}));
}

export function setBitcoinError(error: string | null) {
	bitcoinStore.update((state) => ({
		...state,
		error
	}));
}

// ===== Theme Store =====
export type Theme = 'light' | 'dark';

export const themeStore = writable<Theme>('dark');

export function toggleTheme() {
	themeStore.update((theme) => (theme === 'dark' ? 'light' : 'dark'));
}

// ===== User Store =====
interface UserState {
	authenticated: boolean;
	user: { id: string; name: string; email: string } | null;
}

const initialUserState: UserState = {
	authenticated: false,
	user: null
};

export const userStore = writable<UserState>(initialUserState);

export function setUser(user: UserState['user']) {
	userStore.update((state) => ({
		...state,
		user,
		authenticated: user !== null
	}));
}

export function logout() {
	userStore.update((state) => ({
		...state,
		authenticated: false,
		user: null
	}));
}
