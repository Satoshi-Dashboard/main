<script lang="ts">
	/**
	 * Reusable Button component
	 * @example
	 * <Button variant="primary" size="lg" on:click={handleClick}>
	 *   Click Me
	 * </Button>
	 */

	import type { HTMLButtonAttributes } from 'svelte/elements';

	type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';
	type Size = 'sm' | 'md' | 'lg';

	interface $$Props extends HTMLButtonAttributes {
		variant?: Variant;
		size?: Size;
		disabled?: boolean;
		loading?: boolean;
		fullWidth?: boolean;
	}

	export let variant: Variant = 'primary';
	export let size: Size = 'md';
	export let disabled = false;
	export let loading = false;
	export let fullWidth = false;

	const variantClass: Record<Variant, string> = {
		primary: 'btn-primary',
		secondary: 'btn-secondary',
		danger: 'btn-danger',
		ghost: 'btn-ghost'
	};

	const sizeClass: Record<Size, string> = {
		sm: 'px-3 py-1 text-sm',
		md: 'px-4 py-2 text-base',
		lg: 'px-6 py-3 text-lg'
	};
</script>

<button
	class="{variantClass[variant]} {sizeClass[size]} btn"
	class:w-full={fullWidth}
	class:opacity-50={disabled || loading}
	class:cursor-not-allowed={disabled || loading}
	{disabled}
	{...$$restProps}
>
	{#if loading}
		<span class="inline-block mr-2 animate-spin">⏳</span>
	{/if}
	<slot />
</button>

<style>
	.btn {
		@apply rounded-lg font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2;
	}

	.btn-primary {
		@apply bg-orange-500 text-black hover:bg-orange-600 active:scale-95;
	}

	.btn-secondary {
		@apply bg-gray-700 text-white hover:bg-gray-600 active:scale-95;
	}

	.btn-danger {
		@apply bg-red-600 text-white hover:bg-red-700 active:scale-95;
	}

	.btn-ghost {
		@apply bg-transparent text-white hover:bg-gray-800 active:scale-95;
	}
</style>
