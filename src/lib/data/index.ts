/**
 * Static content, configuration, and mock data
 */

// ===== App Configuration =====
export const APP_CONFIG = {
	name: 'Satoshi Dashboard',
	version: '1.0.0',
	description: 'Bitcoin analytics and data visualization',
	author: 'Development Team',
	supportEmail: 'support@satoshi-dashboard.com'
};

// ===== Feature Flags =====
export const FEATURES = {
	enableAnalytics: true,
	enableNotifications: true,
	enableExport: true,
	betaFeatures: false
};

// ===== Mock Bitcoin Data =====
export const MOCK_BITCOIN_DATA = {
	price: 65234.50,
	marketCap: 1234567890000,
	volume24h: 28456789000,
	change24h: 2.45,
	dominance: 55.3,
	timestamp: new Date()
};

// ===== Chart Colors =====
export const CHART_COLORS = {
	primary: '#F7931A', // Bitcoin Orange
	secondary: '#00D897', // Green
	danger: '#FF4757', // Red
	background: '#0A0A0F',
	cardBackground: '#12121A',
	text: '#E8E6E3'
};

// ===== Navigation Menu =====
export const MENU_ITEMS = [
	{
		label: 'Dashboard',
		href: '/',
		icon: 'grid'
	},
	{
		label: 'Charts',
		href: '/charts',
		icon: 'bar-chart-2'
	},
	{
		label: 'Analytics',
		href: '/analytics',
		icon: 'trending-up'
	},
	{
		label: 'Settings',
		href: '/settings',
		icon: 'settings'
	}
];

// ===== API Endpoints =====
export const API_ENDPOINTS = {
	bitcoin: '/bitcoin',
	bitcoinPrice: '/bitcoin/price',
	bitcoinHistory: '/bitcoin/history',
	user: '/user',
	auth: '/auth'
};

// ===== Time Ranges =====
export const TIME_RANGES = [
	{ label: '1H', value: '1h', days: 0 },
	{ label: '24H', value: '24h', days: 1 },
	{ label: '7D', value: '7d', days: 7 },
	{ label: '30D', value: '30d', days: 30 },
	{ label: '1Y', value: '1y', days: 365 },
	{ label: 'ALL', value: 'all', days: 10000 }
];

// ===== Error Messages =====
export const ERROR_MESSAGES = {
	NETWORK_ERROR: 'Network connection failed. Please check your internet.',
	API_ERROR: 'Failed to fetch data from API.',
	VALIDATION_ERROR: 'Please check your input and try again.',
	NOT_FOUND: 'The requested resource was not found.',
	UNAUTHORIZED: 'You are not authorized to access this resource.',
	SERVER_ERROR: 'An unexpected server error occurred. Please try again later.'
};
