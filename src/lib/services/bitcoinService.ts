/**
 * Frontend business logic for Bitcoin data
 * Orchestrates API calls, transformations, and state management
 */

import { getBitcoinData, getBitcoinHistory } from '$lib/api';
import { setBitcoinPrice, setBitcoinError, setBitcoinLoading } from '$lib/stores';
import type { BitcoinData } from '$lib/types';

/**
 * Service to handle Bitcoin data operations
 */
export const bitcoinService = {
	/**
	 * Fetch current Bitcoin data and update store
	 */
	async loadCurrentData(): Promise<BitcoinData | null> {
		setBitcoinLoading(true);

		try {
			const response = await getBitcoinData();

			if (response.success && response.data) {
				const { price, change24h } = response.data;
				setBitcoinPrice(price, change24h);
				setBitcoinError(null);
				return response.data;
			} else {
				setBitcoinError(response.error || 'Failed to load Bitcoin data');
				return null;
			}
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Unknown error';
			setBitcoinError(message);
			return null;
		} finally {
			setBitcoinLoading(false);
		}
	},

	/**
	 * Fetch historical Bitcoin data
	 */
	async getHistoricalData(startDate: Date, endDate: Date): Promise<BitcoinData[]> {
		try {
			const response = await getBitcoinHistory(startDate, endDate);

			if (response.success && response.data) {
				return response.data;
			} else {
				throw new Error(response.error || 'Failed to fetch historical data');
			}
		} catch (error) {
			console.error('Error fetching historical data:', error);
			return [];
		}
	},

	/**
	 * Calculate price change percentage
	 */
	calculateChangePercentage(oldPrice: number, newPrice: number): number {
		if (oldPrice === 0) return 0;
		return ((newPrice - oldPrice) / oldPrice) * 100;
	},

	/**
	 * Format Bitcoin price for display
	 */
	formatPrice(price: number): string {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			minimumFractionDigits: 2,
			maximumFractionDigits: 2
		}).format(price);
	}
};
