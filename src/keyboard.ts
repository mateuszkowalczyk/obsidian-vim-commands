import { canonicalizeKeyToken } from './keyTokens';

type KeyEventLike = Pick<
	KeyboardEvent,
	'altKey' | 'ctrlKey' | 'key' | 'metaKey' | 'shiftKey'
>;

const NAMED_EVENT_KEYS = new Set(['Enter', 'Escape', 'Tab']);
const EVENT_KEY_NAMES: Record<string, string> = {
	ArrowDown: 'Down',
	ArrowLeft: 'Left',
	ArrowRight: 'Right',
	ArrowUp: 'Up',
	Enter: 'CR',
	Escape: 'Esc',
	Tab: 'Tab',
};

export function normalizeKeyboardEventKey(event: KeyEventLike): string | null {
	if (event.metaKey) {
		return null;
	}

	const modifiers = [
		event.ctrlKey ? 'C' : null,
		event.altKey ? 'A' : null,
		event.shiftKey && (event.ctrlKey || event.altKey || event.key.length !== 1)
			? 'S'
			: null,
	].filter((modifier): modifier is string => modifier !== null);

	if (modifiers.length > 0) {
		return normalizeModifiedKey(modifiers, event.key);
	}

	if (event.key.length === 1) {
		return event.key === ' ' ? '<Space>' : event.key;
	}

	return NAMED_EVENT_KEYS.has(event.key)
		? canonicalizeKeyToken(`<${event.key}>`)
		: null;
}

function normalizeModifiedKey(modifiers: string[], key: string): string | null {
	const vimKey = key.length === 1 ? key : EVENT_KEY_NAMES[key];

	if (!vimKey) {
		return null;
	}

	return canonicalizeKeyToken(`<${modifiers.join('-')}-${vimKey}>`);
}
