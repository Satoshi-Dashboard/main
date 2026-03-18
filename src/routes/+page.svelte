<script lang="ts">
	/**
	 * Main page / Dashboard
	 */

	import Card from '$lib/components/Card.svelte';
	import { bitcoinStore } from '$lib/stores';
	import { formatUSD, formatPercent } from '$lib/utils/formatters';

	// Example: Subscribe to bitcoin store
	let bitcoin = $bitcoinStore;
	$: bitcoin = $bitcoinStore;
</script>

<svelte:head>
	<title>Satoshi Dashboard - Bitcoin Analytics</title>
	<meta name="description" content="Real-time Bitcoin analytics and data visualization" />
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black p-6">
	<div class="max-w-7xl mx-auto">
		{/* Header */}
		<div class="mb-8">
			<h1 class="text-4xl font-bold text-white mb-2">Satoshi Dashboard</h1>
			<p class="text-gray-400">Real-time Bitcoin analytics and insights</p>
		</div>

		{/* Grid Layout */}
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
			{/* Bitcoin Price Card */}
			<Card title="Bitcoin Price">
				<div class="text-3xl font-bold text-white">
					{#if bitcoin.price}
						{formatUSD(bitcoin.price)}
					{:else}
						Loading...
					{/if}
				</div>
				{#if bitcoin.change24h !== undefined}
					<p class="text-sm mt-2" class:text-green-500={bitcoin.change24h >= 0} class:text-red-500={bitcoin.change24h < 0}>
						{formatPercent(bitcoin.change24h)} in 24h
					</p>
				{/if}
			</Card>

			{/* Status Card */}
			<Card title="Status">
				<div class="flex items-center gap-2">
					<div class="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
					<span class="text-white">{bitcoin.loading ? 'Updating...' : 'Connected'}</span>
				</div>
			</Card>

			{/* Error Display */}
			{#if bitcoin.error}
				<Card title="Error" border shadow>
					<p class="text-red-400 text-sm">{bitcoin.error}</p>
				</Card>
			{/if}
		</div>

		{/* Content Section */}
		<div class="mt-12">
			<Card title="Welcome">
				<p class="text-gray-300">Start building your dashboard here. Check the file structure in src/lib/ for examples.</p>
			</Card>
		</div>
	</div>
</div>

<style>
	:global(body) {
		background: #0a0a0f;
		color: #e8e6e3;
	}
</style>
