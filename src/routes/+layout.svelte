<script lang="ts">
	/**
	 * Root layout for all pages
	 */

	import '../lib/styles/app.css';
	import { themeStore } from '$lib/stores';

	// Example: Listen to theme changes
	let theme = $themeStore;
	$: theme = $themeStore;
</script>

<svelte:html lang="en" data-theme={theme} />

<body class="bg-black text-white">
	<slot />
</body>

<style global>
	:root {
		--bg-primary: #0a0a0f;
		--bg-card: #12121a;
		--accent-bitcoin: #f7931a;
		--accent-green: #00d897;
		--accent-red: #ff4757;
		--text-primary: #e8e6e3;
		--text-secondary: #9ca3af;
		--border-color: #374151;
	}

	* {
		margin: 0;
		padding: 0;
		box-sizing: border-box;
	}

	body {
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu',
			'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
		-webkit-font-smoothing: antialiased;
		-moz-osx-font-smoothing: grayscale;
		background: var(--bg-primary);
		color: var(--text-primary);
	}

	a {
		color: var(--accent-bitcoin);
		text-decoration: none;

		&:hover {
			opacity: 0.8;
		}
	}

	button {
		cursor: pointer;
	}
</style>
