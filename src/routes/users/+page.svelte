<script lang="ts">
	/**
	 * Users list page
	 */

	import Card from '$lib/components/Card.svelte';
	import Button from '$lib/components/ui/Button.svelte';

	interface User {
		id: string;
		name: string;
		email: string;
		role: string;
		joinDate: string;
	}

	const users: User[] = [
		{
			id: '1',
			name: 'Alice Johnson',
			email: 'alice@example.com',
			role: 'Admin',
			joinDate: '2024-01-15'
		},
		{
			id: '2',
			name: 'Bob Smith',
			email: 'bob@example.com',
			role: 'User',
			joinDate: '2024-02-20'
		},
		{
			id: '3',
			name: 'Carol Davis',
			email: 'carol@example.com',
			role: 'Analyst',
			joinDate: '2024-03-10'
		}
	];
</script>

<svelte:head>
	<title>Users - Satoshi</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
	<div class="max-w-7xl mx-auto px-6 py-8">
		{/* Header */}
		<div class="flex justify-between items-center mb-8">
			<div>
				<h1 class="text-3xl font-bold text-white mb-2">Users</h1>
				<p class="text-gray-400">Manage application users</p>
			</div>
			<Button variant="primary">Add User</Button>
		</div>

		{/* Users Table */}
		<Card>
			<div class="overflow-x-auto">
				<table class="w-full">
					<thead>
						<tr class="border-b border-gray-700">
							<th class="text-left py-3 px-4 text-white font-semibold">Name</th>
							<th class="text-left py-3 px-4 text-white font-semibold">Email</th>
							<th class="text-left py-3 px-4 text-white font-semibold">Role</th>
							<th class="text-left py-3 px-4 text-white font-semibold">Join Date</th>
							<th class="text-left py-3 px-4 text-white font-semibold">Actions</th>
						</tr>
					</thead>
					<tbody>
						{#each users as user (user.id)}
							<tr class="border-b border-gray-700 hover:bg-gray-800/50 transition">
								<td class="py-3 px-4">
									<a href="/users/{user.id}" class="text-white hover:text-orange-500">
										{user.name}
									</a>
								</td>
								<td class="py-3 px-4 text-gray-400">{user.email}</td>
								<td class="py-3 px-4">
									<span
										class="px-3 py-1 rounded-full text-sm font-medium"
										class:bg-orange-500/20={user.role === 'Admin'}
										class:bg-blue-500/20={user.role === 'Analyst'}
										class:bg-gray-500/20={user.role === 'User'}
										class:text-orange-400={user.role === 'Admin'}
										class:text-blue-400={user.role === 'Analyst'}
										class:text-gray-400={user.role === 'User'}
									>
										{user.role}
									</span>
								</td>
								<td class="py-3 px-4 text-gray-400">{user.joinDate}</td>
								<td class="py-3 px-4">
									<div class="flex gap-2">
										<Button size="sm" variant="ghost">Edit</Button>
										<Button size="sm" variant="danger">Delete</Button>
									</div>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</Card>
	</div>
</div>
