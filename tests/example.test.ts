/**
 * Example unit tests using Vitest
 * Run with: npm run test
 */

import { describe, it, expect } from 'vitest';
import { formatUSD, formatPercent, formatCompact } from '../src/lib/utils/formatters';

describe('Formatter utilities', () => {
	describe('formatUSD', () => {
		it('should format number as USD currency', () => {
			expect(formatUSD(1234.56)).toBe('$1,234.56');
		});

		it('should handle large numbers', () => {
			const result = formatUSD(1000000);
			expect(result).toContain('$');
			expect(result).toContain('1');
		});

		it('should handle zero', () => {
			expect(formatUSD(0)).toBe('$0.00');
		});
	});

	describe('formatPercent', () => {
		it('should format positive percentage with plus sign', () => {
			expect(formatPercent(5.5)).toBe('+5.50%');
		});

		it('should format negative percentage', () => {
			expect(formatPercent(-3.2)).toBe('-3.20%');
		});

		it('should handle zero', () => {
			expect(formatPercent(0)).toBe('+0.00%');
		});
	});

	describe('formatCompact', () => {
		it('should format large numbers to compact notation', () => {
			const result = formatCompact(1234567);
			expect(result).toContain('M');
		});

		it('should format thousands to K', () => {
			const result = formatCompact(5000);
			expect(result).toContain('K');
		});

		it('should format billions to B', () => {
			const result = formatCompact(1000000000);
			expect(result).toContain('B');
		});
	});
});
