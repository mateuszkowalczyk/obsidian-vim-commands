import { normalizeKeyboardEventKey } from './keyboard';
import { CommandMapping } from './parser';
import { advanceKeySequence } from './sequence';

type KeydownEventLike = Pick<
	KeyboardEvent,
	| 'altKey'
	| 'ctrlKey'
	| 'key'
	| 'metaKey'
	| 'preventDefault'
	| 'stopPropagation'
	| 'target'
>;

interface KeydownHandlerOptions {
	getMappings: () => CommandMapping[];
	isVimInsertModeTarget: (target: EventTarget | null) => boolean;
	onCommand: (commandId: string) => void;
}

const FORM_ENTRY_SELECTOR = 'input, textarea, select';
const CONTENT_EDITABLE_SELECTOR =
	'[contenteditable]:not([contenteditable="false"])';
const MARKDOWN_EDITOR_SELECTOR = '.markdown-source-view, .cm-editor';

export function createKeydownHandler({
	getMappings,
	isVimInsertModeTarget,
	onCommand,
}: KeydownHandlerOptions): (event: KeydownEventLike) => void {
	let buffer: string[] = [];

	return (event) => {
		if (shouldIgnoreKeydownTarget(event.target, isVimInsertModeTarget)) {
			return;
		}

		const key = normalizeKeyboardEventKey(event);

		if (key === null) {
			return;
		}

		const state = advanceKeySequence(buffer, key, getMappings());
		buffer = state.buffer;

		if (state.result.type === 'pending') {
			event.preventDefault();
			event.stopPropagation();
			return;
		}

		if (state.result.type === 'matched') {
			event.preventDefault();
			event.stopPropagation();
			onCommand(state.result.commandId);
			return;
		}

		if (state.result.type === 'cancelled') {
			event.preventDefault();
		}
	};
}

export function shouldIgnoreKeydownTarget(
	target: EventTarget | null,
	isVimInsertModeTarget: (target: EventTarget | null) => boolean = () => false,
): boolean {
	if (!target || typeof target !== 'object') {
		return false;
	}

	const element = target as ElementLike;

	if (isMarkdownEditorTarget(target)) {
		return isVimInsertModeTarget(target);
	}

	return isEditableTarget(element);
}

export function isMarkdownEditorTarget(target: EventTarget | null): boolean {
	if (!target || typeof target !== 'object') {
		return false;
	}

	return Boolean((target as ElementLike).closest?.(MARKDOWN_EDITOR_SELECTOR));
}

function isEditableTarget(element: ElementLike): boolean {
	const selector = `${FORM_ENTRY_SELECTOR}, ${CONTENT_EDITABLE_SELECTOR}`;

	if (element.matches?.(selector)) {
		return true;
	}

	return Boolean(element.closest?.(selector));
}

interface ElementLike {
	closest?: (selector: string) => ElementLike | null;
	matches?: (selector: string) => boolean;
}
