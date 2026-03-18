/**
 * Utility functions for formatting data
 */

/**
 * Format number as USD currency
 * @example formatUSD(1234.56) → "$1,234.56"
 */
export function formatUSD(value: number): string {
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD'
	}).format(value);
}

/**
 * Format large numbers to compact notation (K, M, B)
 * @example formatCompact(1234567) → "1.2M"
 */
export function formatCompact(value: number): string {
	return new Intl.NumberFormat('en-US', {
		notation: 'compact',
		maximumFractionDigits: 1
	}).format(value);
}

/**
 * Format percentage with sign
 * @example formatPercent(5.5) → "+5.50%"
 */
export function formatPercent(value: number): string {
	const sign = value >= 0 ? '+' : '';
	return `${sign}${value.toFixed(2)}%`;
}

/**
 * Format date to readable string
 * @example formatDate(new Date()) → "Mar 18, 2026"
 */
export function formatDate(date: Date): string {
	return new Intl.DateTimeFormat('en-US', {
		year: 'numeric',
		month: 'short',
		day: 'numeric'
	}).format(date);
}

/**
 * Format timestamp to relative time
 * @example formatTimeAgo(Date.now() - 3600000) → "1 hour ago"
 */
export function formatTimeAgo(timestamp: number): string {
	const now = Date.now();
	const seconds = Math.floor((now - timestamp) / 1000);

	const intervals: { [key: string]: number } = {
		year: 31536000,
		month: 2592000,
		week: 604800,
		day: 86400,
		hour: 3600,
		minute: 60
	};

	for (const [name, secondsPerUnit] of Object.entries(intervals)) {
		const interval = Math.floor(seconds / secondsPerUnit);
		if (interval >= 1) {
			return `${interval} ${name}${interval > 1 ? 's' : ''} ago`;
		}
	}

	return 'just now';
}
