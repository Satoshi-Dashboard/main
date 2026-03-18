import type { Config } from 'tailwindcss';

export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			colors: {
				// Accents
				bitcoin: 'var(--accent-bitcoin)',
				success: 'var(--accent-green)',
				error: 'var(--accent-red)',
				warning: 'var(--accent-warning)',
			},
			backgroundColor: {
				// Backgrounds
				primary: 'var(--bg-primary)',
				card: 'var(--bg-card)',
				'card-hover': 'var(--bg-card-hover)',
				elevated: 'var(--bg-elevated)',
			},
			textColor: {
				// Text colors
				primary: 'var(--text-primary)',
				secondary: 'var(--text-secondary)',
				muted: 'var(--text-muted)',
			},
			borderColor: {
				primary: 'var(--border-color)',
			},
			fontSize: {
				// Page titles (h1)
				'h1-sm': ['24px', { lineHeight: '32px', fontWeight: '700' }],
				'h1-md': ['28px', { lineHeight: '36px', fontWeight: '700' }],
				'h1-lg': ['32px', { lineHeight: '40px', fontWeight: '700' }],

				// Card titles (h2/h3)
				'h2-sm': ['15px', { lineHeight: '22px', fontWeight: '600' }],
				'h2-md': ['16px', { lineHeight: '24px', fontWeight: '600' }],
				'h2-lg': ['18px', { lineHeight: '26px', fontWeight: '600' }],

				// Metrics (p, dd)
				'metric-sm': ['24px', { lineHeight: '28px', fontWeight: '700' }],
				'metric-md': ['28px', { lineHeight: '32px', fontWeight: '700' }],
				'metric-lg': ['36px', { lineHeight: '40px', fontWeight: '700' }],

				// Body text (p)
				'body-sm': ['14px', { lineHeight: '20px', fontWeight: '400' }],
				'body-md': ['15px', { lineHeight: '22px', fontWeight: '400' }],
				'body-lg': ['16px', { lineHeight: '24px', fontWeight: '400' }],

				// Small text (small, time)
				'small-sm': ['12px', { lineHeight: '16px', fontWeight: '400' }],
				'small-md': ['13px', { lineHeight: '18px', fontWeight: '400' }],
				'small-lg': ['14px', { lineHeight: '20px', fontWeight: '400' }],
			},
			spacing: {
				// Grid margins
				'margin-mobile': '16px',
				'margin-tablet': '24px',
				'margin-desktop': '32px',

				// Grid gutters
				'gutter-mobile': '16px',
				'gutter-tablet': '20px',
				'gutter-desktop': '24px',
			},
			gap: {
				'gutter-mobile': '16px',
				'gutter-tablet': '20px',
				'gutter-desktop': '24px',
			},
			animation: {
				'fade-in': 'fadeIn 0.3s ease-in-out',
				'slide-in': 'slideIn 0.3s ease-in-out',
			},
			keyframes: {
				fadeIn: {
					'0%': { opacity: '0', transform: 'translateY(10px)' },
					'100%': { opacity: '1', transform: 'translateY(0)' },
				},
				slideIn: {
					'0%': { opacity: '0', transform: 'translateX(-20px)' },
					'100%': { opacity: '1', transform: 'translateX(0)' },
				},
			},
			fontFamily: {
				sans: [
					'-apple-system',
					'BlinkMacSystemFont',
					'"Segoe UI"',
					'Roboto',
					'"Helvetica Neue"',
					'Arial',
					'sans-serif',
				],
			},
		},
	},
	plugins: [],
} satisfies Config;
