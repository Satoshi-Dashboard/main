// Server-side hooks for SvelteKit
// This file runs on the Node.js server

import type { RequestHandler } from '@sveltejs/kit';

/**
 * Example: Handle errors globally
 * This is called whenever an exception is thrown
 */
export async function handleError({ error, event }: Parameters<Parameters<typeof error>[0]>[0]) {
	console.error('Server Error:', error);
	console.error('Event:', event.url.pathname);

	return {
		message: 'An unexpected error occurred',
		code: error instanceof Error ? error.message : 'UNKNOWN_ERROR'
	};
}

/**
 * Example: Hook to run before processing a request
 */
export async function handle({ event, resolve }: any) {
	// You can modify event.locals here
	// event.locals.user = await authenticate(event.request);

	return resolve(event);
}
