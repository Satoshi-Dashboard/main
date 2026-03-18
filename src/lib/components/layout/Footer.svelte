<script lang="ts">
	/**
	 * Footer component
	 */

	import { APP_CONFIG } from '$lib/data';
</script>

<footer class="border-t border-gray-700 bg-black py-8">
	<div class="max-w-7xl mx-auto px-6">
		<div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
			{/* Column 1: About */}
			<div>
				<h3 class="font-bold text-white mb-4">About</h3>
				<p class="text-gray-400 text-sm">{APP_CONFIG.description}</p>
			</div>

			{/* Column 2: Links */}
			<div>
				<h3 class="font-bold text-white mb-4">Quick Links</h3>
				<ul class="space-y-2 text-sm">
					<li><a href="/" class="text-gray-400 hover:text-white transition">Dashboard</a></li>
					<li><a href="/dashboard" class="text-gray-400 hover:text-white transition">Charts</a></li>
					<li><a href="/users" class="text-gray-400 hover:text-white transition">Users</a></li>
				</ul>
			</div>

			{/* Column 3: Legal */}
			<div>
				<h3 class="font-bold text-white mb-4">Legal</h3>
				<ul class="space-y-2 text-sm">
					<li><a href="#" class="text-gray-400 hover:text-white transition">Privacy</a></li>
					<li><a href="#" class="text-gray-400 hover:text-white transition">Terms</a></li>
					<li><a href="#" class="text-gray-400 hover:text-white transition">Contact</a></li>
				</ul>
			</div>
		</div>

		{/* Bottom */}
		<div class="border-t border-gray-700 pt-8 flex justify-between items-center text-sm text-gray-400">
			<p>&copy; 2026 {APP_CONFIG.name}. All rights reserved.</p>
			<p>v{APP_CONFIG.version}</p>
		</div>
	</div>
</footer>
