/**
 * Health check endpoint
 * GET /api/health
 */

import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async () => {
	const healthStatus = {
		status: 'healthy',
		timestamp: new Date().toISOString(),
		uptime: process.uptime(),
		environment: process.env.NODE_ENV || 'development',
		version: '1.0.0'
	};

	return new Response(JSON.stringify(healthStatus), {
		status: 200,
		headers: {
			'Content-Type': 'application/json',
			'Cache-Control': 'no-cache'
		}
	});
};

export const POST: RequestHandler = async ({ request }) => {
	if (request.method !== 'POST') {
		return new Response('Method not allowed', { status: 405 });
	}

	try {
		const data = await request.json();

		return new Response(
			JSON.stringify({
				status: 'received',
				data,
				timestamp: new Date().toISOString()
			}),
			{
				status: 200,
				headers: { 'Content-Type': 'application/json' }
			}
		);
	} catch (error) {
		return new Response(
			JSON.stringify({
				status: 'error',
				message: error instanceof Error ? error.message : 'Unknown error'
			}),
			{
				status: 400,
				headers: { 'Content-Type': 'application/json' }
			}
		);
	}
};
