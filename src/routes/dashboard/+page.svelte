<script lang="ts">
	/**
	 * Dashboard page
	 */

	import Card from '$lib/components/Card.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { bitcoinStore } from '$lib/stores';
	import { formatUSD, formatPercent } from '$lib/utils/formatters';

	let bitcoin = $bitcoinStore;
	$: bitcoin = $bitcoinStore;

	let loading = false;

	async function refreshData() {
		loading = true;
		// Simulate API call
		await new Promise((resolve) => setTimeout(resolve, 1000));
		loading = false;
	}
</script>

<svelte:head>
	<title>Dashboard - Satoshi</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
	<div class="max-w-7xl mx-auto px-6 py-8">
		{/* Title */}
		<div class="mb-8">
			<h1 class="text-3xl font-bold text-white mb-2">Dashboard</h1>
			<p class="text-gray-400">Welcome to your Bitcoin analytics dashboard</p>
		</div>

		{/* Metrics Grid */}
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
			<Card title="Bitcoin Price">
				<div class="text-3xl font-bold text-white">
					{#if bitcoin.price}
						{formatUSD(bitcoin.price)}
					{:else}
						$0.00
					{/if}
				</div>
				{#if bitcoin.change24h}
					<p
						class="text-sm mt-2"
						class:text-green-500={bitcoin.change24h >= 0}
						class:text-red-500={bitcoin.change24h < 0}
					>
						{formatPercent(bitcoin.change24h)} 24h
					</p>
				{/if}
			</Card>

			<Card title="Market Cap">
				<div class="text-3xl font-bold text-white">$1.2T</div>
				<p class="text-sm text-green-500 mt-2">+3.2% week</p>
			</Card>

			<Card title="24h Volume">
				<div class="text-3xl font-bold text-white">$28B</div>
				<p class="text-sm text-gray-400 mt-2">Hourly avg</p>
			</Card>

			<Card title="Dominance">
				<div class="text-3xl font-bold text-white">55.3%</div>
				<p class="text-sm text-yellow-500 mt-2">vs altcoins</p>
			</Card>
		</div>

		{/* Actions */}
		<Card title="Actions">
			<div class="flex flex-wrap gap-3">
				<Button variant="primary" on:click={refreshData} {loading}> Refresh Data </Button>
				<Button variant="secondary">Export CSV</Button>
				<Button variant="ghost">Settings</Button>
			</div>
		</Card>
	</div>
</div>
