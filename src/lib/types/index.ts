/**
 * TypeScript type definitions
 * Central location for all shared types and interfaces
 */

// Example: Bitcoin data types
export interface BitcoinData {
	price: number;
	marketCap: number;
	volume24h: number;
	change24h: number;
	timestamp: Date;
}

export interface ApiResponse<T> {
	success: boolean;
	data?: T;
	error?: string;
	timestamp: string;
}

// Example: User types
export interface User {
	id: string;
	name: string;
	email: string;
	createdAt: Date;
}
