/**
 * Backend / External API connection
 */

import type { ApiResponse, BitcoinData } from '$lib/types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

/**
 * Generic fetch wrapper with error handling
 */
async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
	try {
		const response = await fetch(`${API_BASE_URL}${endpoint}`, {
			headers: {
				'Content-Type': 'application/json',
				...options?.headers
			},
			...options
		});

		if (!response.ok) {
			throw new Error(`API Error: ${response.statusText}`);
		}

		const data = await response.json();
		return {
			success: true,
			data,
			timestamp: new Date().toISOString()
		};
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error',
			timestamp: new Date().toISOString()
		};
	}
}

// ===== Bitcoin API Calls =====
export async function getBitcoinData(): Promise<ApiResponse<BitcoinData>> {
	return fetchAPI<BitcoinData>('/bitcoin');
}

export async function getBitcoinPrice(): Promise<ApiResponse<{ price: number }>> {
	return fetchAPI<{ price: number }>('/bitcoin/price');
}

export async function getBitcoinHistory(
	startDate: Date,
	endDate: Date
): Promise<ApiResponse<BitcoinData[]>> {
	const params = new URLSearchParams({
		start: startDate.toISOString(),
		end: endDate.toISOString()
	});
	return fetchAPI<BitcoinData[]>(`/bitcoin/history?${params}`);
}

// ===== User API Calls =====
export async function loginUser(email: string, password: string) {
	return fetchAPI('/auth/login', {
		method: 'POST',
		body: JSON.stringify({ email, password })
	});
}

export async function logoutUser() {
	return fetchAPI('/auth/logout', {
		method: 'POST'
	});
}

export async function getCurrentUser() {
	return fetchAPI('/user/me');
}
