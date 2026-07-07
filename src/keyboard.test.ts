import { describe, expect, it } from 'vitest';
import { normalizeKeyboardEventKey } from './keyboard';

describe('normalizeKeyboardEventKey', () => {
	it('normalizes named keys', () => {
		expect(normalizeKeyboardEventKey(keyEvent({ key: ' ' }))).toBe('<Space>');
		expect(normalizeKeyboardEventKey(keyEvent({ key: 'Escape' }))).toBe(
			'<Esc>',
		);
		expect(normalizeKeyboardEventKey(keyEvent({ key: 'Enter' }))).toBe(
			'<CR>',
		);
	});

	it('keeps printable keys as typed', () => {
		expect(normalizeKeyboardEventKey(keyEvent({ key: 'g' }))).toBe('g');
		expect(normalizeKeyboardEventKey(keyEvent({ key: 'H' }))).toBe('H');
		expect(normalizeKeyboardEventKey(keyEvent({ key: '/' }))).toBe('/');
		expect(normalizeKeyboardEventKey(keyEvent({ key: ':' }))).toBe(':');
		expect(normalizeKeyboardEventKey(keyEvent({ key: '|' }))).toBe('|');
		expect(normalizeKeyboardEventKey(keyEvent({ key: '-' }))).toBe('-');
	});

	it('normalizes control-key combinations', () => {
		expect(
			normalizeKeyboardEventKey(keyEvent({ ctrlKey: true, key: 'o' })),
		).toBe('<C-o>');
		expect(
			normalizeKeyboardEventKey(keyEvent({ ctrlKey: true, key: 'I' })),
		).toBe('<C-i>');
	});

	it('normalizes alt-key combinations using Vimrc Support notation', () => {
		expect(
			normalizeKeyboardEventKey(keyEvent({ altKey: true, key: 'p' })),
		).toBe('<A-p>');
		expect(
			normalizeKeyboardEventKey(keyEvent({ altKey: true, key: 'B' })),
		).toBe('<A-b>');
	});

	it('ignores unsupported meta combinations and non-printable keys', () => {
		expect(
			normalizeKeyboardEventKey(keyEvent({ metaKey: true, key: 'o' })),
		).toBeNull();
		expect(
			normalizeKeyboardEventKey(keyEvent({ altKey: true, key: 'ArrowLeft' })),
		).toBeNull();
		expect(normalizeKeyboardEventKey(keyEvent({ key: 'ArrowLeft' }))).toBeNull();
	});
});

function keyEvent(
	overrides: Partial<KeyboardEvent>,
): Pick<KeyboardEvent, 'altKey' | 'ctrlKey' | 'key' | 'metaKey'> {
	return {
		altKey: false,
		ctrlKey: false,
		key: '',
		metaKey: false,
		...overrides,
	};
}
