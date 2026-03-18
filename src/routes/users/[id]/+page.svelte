<script lang="ts">
	/**
	 * Dynamic user detail page
	 */

	import Card from '$lib/components/Card.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<svelte:head>
	<title>{data.user.name} - Satoshi</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
	<div class="max-w-4xl mx-auto px-6 py-8">
		{/* Back Button */}
		<div class="mb-8">
			<a href="/users" class="text-orange-500 hover:text-orange-400 transition">← Back to Users</a>
		</div>

		{/* User Header */}
		<Card title={data.user.name}>
			<div class="space-y-4">
				<div>
					<p class="text-gray-400 text-sm">Email</p>
					<p class="text-white text-lg">{data.user.email}</p>
				</div>

				<div>
					<p class="text-gray-400 text-sm">Role</p>
					<p class="text-white text-lg">{data.user.role}</p>
				</div>

				<div>
					<p class="text-gray-400 text-sm">Joined</p>
					<p class="text-white text-lg">{data.user.joinDate}</p>
				</div>

				<div class="flex gap-3 pt-4">
					<Button variant="primary">Edit</Button>
					<Button variant="danger">Delete</Button>
					<Button variant="secondary">View Activity</Button>
				</div>
			</div>
		</Card>

		{/* User Stats */}
		<div class="grid grid-cols-2 gap-6 mt-8">
			<Card title="Login Activity">
				<p class="text-3xl font-bold text-white">12</p>
				<p class="text-gray-400 text-sm mt-2">Last login: 2 hours ago</p>
			</Card>

			<Card title="Resources Accessed">
				<p class="text-3xl font-bold text-white">48</p>
				<p class="text-gray-400 text-sm mt-2">This month</p>
			</Card>
		</div>
	</div>
</div>
