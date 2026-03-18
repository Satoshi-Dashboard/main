<script lang="ts">
	/**
	 * Header/Navbar component
	 */

	import { themeStore, toggleTheme } from '$lib/stores';

	let theme = $themeStore;
	$: theme = $themeStore;
</script>

<header class="sticky top-0 z-50 border-b border-gray-700 bg-black/80 backdrop-blur">
	<div class="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
		{/* Logo */}
		<div class="flex items-center gap-3">
			<div class="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
				<span class="text-white font-bold text-sm">₿</span>
			</div>
			<h1 class="text-xl font-bold text-white">Satoshi</h1>
		</div>

		{/* Theme Toggle */}
		<button
			on:click={toggleTheme}
			class="px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors text-sm font-medium text-white"
		>
			{theme === 'dark' ? '☀️' : '🌙'} {theme === 'dark' ? 'Light' : 'Dark'}
		</button>
	</div>
</header>

<style>
	header {
		background: linear-gradient(180deg, rgba(10, 10, 15, 0.95) 0%, rgba(10, 10, 15, 0.8) 100%);
	}
</style>
