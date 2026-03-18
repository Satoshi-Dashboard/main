import type { Config } from 'tailwindcss';

export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			colors: {
				bitcoin: '#F7931A',
				primary: '#0A0A0F',
				dark: {
					card: '#12121A',
					bg: '#0A0A0F',
					border: '#374151'
				}
			},
			backgroundColor: {
				primary: 'var(--bg-primary)',
				card: 'var(--bg-card)'
			},
			textColor: {
				primary: 'var(--text-primary)',
				secondary: 'var(--text-secondary)'
			},
			borderColor: {
				primary: 'var(--border-color)'
			},
			animation: {
				'fade-in': 'fadeIn 0.3s ease-in-out',
				'slide-in': 'slideIn 0.3s ease-in-out'
			},
			keyframes: {
				fadeIn: {
					'0%': { opacity: '0', transform: 'translateY(10px)' },
					'100%': { opacity: '1', transform: 'translateY(0)' }
				},
				slideIn: {
					'0%': { opacity: '0', transform: 'translateX(-20px)' },
					'100%': { opacity: '1', transform: 'translateX(0)' }
				}
			},
			fontFamily: {
				sans: [
					'-apple-system',
					'BlinkMacSystemFont',
					'"Segoe UI"',
					'Roboto',
					'"Helvetica Neue"',
					'Arial',
					'sans-serif'
				]
			}
		}
	},
	plugins: []
} satisfies Config;
