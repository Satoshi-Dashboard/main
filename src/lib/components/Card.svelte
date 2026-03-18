<script lang="ts">
	/**
	 * Reusable Card component
	 * @example
	 * <Card title="Bitcoin Price">
	 *   <p>$65,234.50</p>
	 * </Card>
	 */

	export let title: string = '';
	export let subtitle: string | null = null;
	export let padding: string = 'p-6';
	export let border: boolean = true;
	export let shadow: boolean = true;
</script>

<div
	class="{padding} rounded-lg bg-[var(--card-bg)]"
	class:border="border border-gray-700"
	class:shadow-lg={shadow}
>
	{#if title}
		<div class="mb-4">
			<h3 class="text-lg font-semibold text-white">{title}</h3>
			{#if subtitle}
				<p class="text-sm text-gray-400 mt-1">{subtitle}</p>
			{/if}
		</div>
	{/if}

	<slot />
</div>

<style>
	:global(:root) {
		--card-bg: #12121a;
	}
</style>
