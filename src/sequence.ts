import { CommandMapping } from './parser';

export type KeySequenceResult =
	// Keep the buffer because it is a prefix of at least one mapping.
	| { type: 'pending'; commandId?: string }
	// Execute the mapped command and clear the buffer.
	| { type: 'matched'; commandId: string }
	// Clear the buffer because no mapping or prefix matches.
	| { type: 'reset' }
	// Clear the active buffer because the user pressed Esc.
	| { type: 'cancelled' };

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
	const hasLongerPrefixMatch = mappings.some(
		(mapping) =>
			mapping.keys.length > nextBuffer.length &&
			isSequencePrefix(nextBuffer, mapping.keys),
	);

	if (exactMatch && hasLongerPrefixMatch) {
		return {
			buffer: nextBuffer,
			result: { type: 'pending', commandId: exactMatch.commandId },
		};
	}

	if (exactMatch) {
		return {
			buffer: [],
			result: { type: 'matched', commandId: exactMatch.commandId },
		};
	}

	if (hasLongerPrefixMatch) {
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
