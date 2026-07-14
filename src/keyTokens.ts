const KEY_NAMES: Record<string, string> = {
	' ': 'Space',
	cr: 'CR',
	down: 'Down',
	enter: 'CR',
	esc: 'Esc',
	escape: 'Esc',
	left: 'Left',
	right: 'Right',
	space: 'Space',
	tab: 'Tab',
	up: 'Up',
};

const MODIFIER_ORDER = ['C', 'A', 'S'];

export function canonicalizeKeyToken(token: string): string {
	if (!token.startsWith('<') || !token.endsWith('>')) {
		return token;
	}

	const parts = token.slice(1, -1).split('-');
	const rawKey = parts.pop();

	if (!rawKey) {
		return token;
	}

	const modifiers = parts.map((modifier) => modifier.toUpperCase());

	if (modifiers.some((modifier) => !MODIFIER_ORDER.includes(modifier))) {
		return token;
	}

	const canonicalModifiers = MODIFIER_ORDER.filter((modifier) =>
		modifiers.includes(modifier),
	);
	const key = KEY_NAMES[rawKey.toLowerCase()]
		?? (canonicalModifiers.length > 0 && rawKey.length === 1
			? rawKey.toLowerCase()
			: rawKey);

	if (canonicalModifiers.length === 1 && canonicalModifiers[0] === 'S' && key.length === 1) {
		return key.toUpperCase();
	}

	const modifierPrefix = canonicalModifiers.length > 0
		? `${canonicalModifiers.join('-')}-`
		: '';
	return `<${modifierPrefix}${key}>`;
}
