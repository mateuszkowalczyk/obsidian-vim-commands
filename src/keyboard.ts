type KeyEventLike = Pick<
	KeyboardEvent,
	'altKey' | 'ctrlKey' | 'key' | 'metaKey'
>;

const NAMED_KEY_TOKENS: Record<string, string> = {
	' ': '<Space>',
	Escape: '<Esc>',
	Enter: '<CR>',
	Tab: '<Tab>',
};

export function normalizeKeyboardEventKey(event: KeyEventLike): string | null {
	if (event.metaKey) {
		return null;
	}

	if (event.altKey) {
		return normalizeModifiedKey('A', event.key);
	}

	if (event.ctrlKey) {
		return normalizeModifiedKey('C', event.key);
	}

	return NAMED_KEY_TOKENS[event.key] ?? normalizePrintableKey(event.key);
}

function normalizeModifiedKey(modifier: 'A' | 'C', key: string): string | null {
	if (key.length !== 1) {
		return null;
	}

	return `<${modifier}-${key.toLowerCase()}>`;
}

function normalizePrintableKey(key: string): string | null {
	return key.length === 1 ? key : null;
}
