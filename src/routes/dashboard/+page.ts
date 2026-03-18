/**
 * Dashboard page loader
 * Runs on server-side to fetch initial data
 */

import type { PageLoad } from './$types';

interface DashboardData {
	title: string;
	description: string;
	timestamp: string;
	metrics: {
		btcPrice: number;
		marketCap: string;
		volume24h: string;
		dominance: number;
	};
}

/**
 * Load function: runs on the server before rendering the page
 * Can fetch data, validate user auth, etc.
 */
export const load: PageLoad<DashboardData> = async ({ fetch }) => {
	try {
		// Example: Fetch data from your API
		// const response = await fetch('/api/dashboard');
		// const data = await response.json();

		return {
			title: 'Bitcoin Dashboard',
			description: 'Real-time Bitcoin analytics and insights',
			timestamp: new Date().toISOString(),
			metrics: {
				btcPrice: 65234.5,
				marketCap: '$1.2T',
				volume24h: '$28B',
				dominance: 55.3
			}
		};
	} catch (error) {
		console.error('Error loading dashboard:', error);
		throw error;
	}
};
