import { describe, expect, it } from 'vitest';
import { CommandMapping } from './parser';
import { advanceKeySequence } from './sequence';

const mappings: CommandMapping[] = [
	{
		keys: ['<Space>', '<Space>'],
		commandId: 'switcher:open',
		requiresDomFallback: true,
	},
	{
		keys: ['<Space>', '/'],
		commandId: 'global-search:open',
		requiresDomFallback: true,
	},
	{
		keys: ['H'],
		commandId: 'workspace:previous-tab',
		requiresDomFallback: false,
	},
];

describe('advanceKeySequence', () => {
	it('keeps waiting while the buffer is a mapping prefix', () => {
		expect(advanceKeySequence([], '<Space>', mappings)).toEqual({
			buffer: ['<Space>'],
			result: { type: 'pending' },
		});
	});

	it('matches exact key sequences and resets the buffer', () => {
		expect(advanceKeySequence(['<Space>'], '/', mappings)).toEqual({
			buffer: [],
			result: { type: 'matched', commandId: 'global-search:open' },
		});
	});

	it('matches single-key mappings', () => {
		expect(advanceKeySequence([], 'H', mappings)).toEqual({
			buffer: [],
			result: { type: 'matched', commandId: 'workspace:previous-tab' },
		});
	});

	it('resets the buffer when no mapping or prefix matches', () => {
		expect(advanceKeySequence(['<Space>'], 'x', mappings)).toEqual({
			buffer: [],
			result: { type: 'reset' },
		});
	});

	it('cancels an active sequence when Esc is pressed', () => {
		expect(advanceKeySequence(['<Space>'], '<Esc>', mappings)).toEqual({
			buffer: [],
			result: { type: 'cancelled' },
		});
	});

	it('does not treat Esc as cancellation without an active sequence', () => {
		expect(advanceKeySequence([], '<Esc>', mappings)).toEqual({
			buffer: [],
			result: { type: 'reset' },
		});
	});

	it('prefers exact matches over longer prefixes', () => {
		expect(
			advanceKeySequence([], 'g', [
				{
					keys: ['g'],
					commandId: 'single-g',
					requiresDomFallback: false,
				},
				{
					keys: ['g', 'g'],
					commandId: 'double-g',
					requiresDomFallback: false,
				},
			]),
		).toEqual({
			buffer: [],
			result: { type: 'matched', commandId: 'single-g' },
		});
	});
});
