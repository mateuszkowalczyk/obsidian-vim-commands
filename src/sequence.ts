import { CommandMapping } from './parser';

export type KeySequenceResult =
	| { type: 'matched'; commandId: string }
	| { type: 'cancelled' }
	| { type: 'pending' }
	| { type: 'reset' };

export interface KeySequenceState {
	buffer: string[];
	result: KeySequenceResult;
}

export function advanceKeySequence(
	buffer: string[],
	key: string,
	mappings: CommandMapping[],
): KeySequenceState {
	if (key === '<Esc>' && buffer.length > 0) {
		return { buffer: [], result: { type: 'cancelled' } };
	}

	const nextBuffer = [...buffer, key];
	const exactMatch = mappings.find((mapping) =>
		isSameSequence(mapping.keys, nextBuffer),
	);

	if (exactMatch) {
		return {
			buffer: [],
			result: { type: 'matched', commandId: exactMatch.commandId },
		};
	}

	const hasPrefixMatch = mappings.some((mapping) =>
		isSequencePrefix(nextBuffer, mapping.keys),
	);

	if (hasPrefixMatch) {
		return { buffer: nextBuffer, result: { type: 'pending' } };
	}

	return { buffer: [], result: { type: 'reset' } };
}

function isSameSequence(left: string[], right: string[]): boolean {
	return left.length === right.length && isSequencePrefix(left, right);
}

function isSequencePrefix(prefix: string[], sequence: string[]): boolean {
	return prefix.every((key, index) => sequence[index] === key);
}
