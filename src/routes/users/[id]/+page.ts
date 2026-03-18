/**
 * Dynamic user detail page loader
 */

import type { PageLoad } from './$types';

interface User {
	id: string;
	name: string;
	email: string;
	role: string;
	joinDate: string;
}

/**
 * Load function: runs on the server before rendering the page
 * Gets the user ID from the route params
 */
export const load: PageLoad<{ user: User }> = async ({ params, fetch }) => {
	const userId = params.id;

	try {
		// Example: Fetch user data from your API
		// const response = await fetch(`/api/users/${userId}`);
		// const user = await response.json();

		// Mock data for demo
		const user: User = {
			id: userId,
			name: 'Alice Johnson',
			email: 'alice@example.com',
			role: 'Admin',
			joinDate: '2024-01-15'
		};

		return {
			user
		};
	} catch (error) {
		console.error(`Error loading user ${userId}:`, error);
		throw error;
	}
};
