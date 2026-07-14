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

export interface KeydownHandler {
	(event: KeydownEventLike): void;
	cancel(): void;
}

const FORM_ENTRY_SELECTOR = 'input, textarea, select';
const CONTENT_EDITABLE_SELECTOR =
	'[contenteditable]:not([contenteditable="false"])';
const CODEMIRROR_CONTENT_SELECTOR = '.cm-content';
const MARKDOWN_EDITOR_SELECTOR = '.markdown-source-view, .cm-editor';

const SEQUENCE_TIMEOUT_MS = 1000;

export function createKeydownHandler({
	getMappings,
	isVimInsertModeTarget,
	onCommand,
}: KeydownHandlerOptions): KeydownHandler {
	let buffer: string[] = [];
	let timeoutId: number | null = null;
	let disposed = false;

	function clearBuffer() {
		buffer = [];
		if (timeoutId !== null) {
			window.clearTimeout(timeoutId);
			timeoutId = null;
		}
	}

	function startTimeout(commandId: string | undefined, target: EventTarget | null) {
		if (timeoutId !== null) {
			window.clearTimeout(timeoutId);
		}
		const pendingKeys = [...buffer];
		timeoutId = window.setTimeout(() => {
			timeoutId = null;
			buffer = [];
			if (
				commandId !== undefined &&
				!disposed &&
				isTimeoutContextValid(target, pendingKeys, commandId)
			) {
				onCommand(commandId);
			}
		}, SEQUENCE_TIMEOUT_MS);
	}

	function isTimeoutContextValid(
		target: EventTarget | null,
		pendingKeys: string[],
		commandId: string,
	): boolean {
		if (!isStillActiveTarget(target) || isTextEntryTarget(target)) {
			return false;
		}

		const markdownEditorTarget = isMarkdownEditorTarget(target);
		if (markdownEditorTarget && isVimInsertModeTarget(target)) {
			return false;
		}

		const mappings = markdownEditorTarget
			? getMappings().filter((mapping) => mapping.requiresDomFallback)
			: getMappings();

		return mappings.some(
			(mapping) =>
				mapping.commandId === commandId &&
				mapping.keys.length === pendingKeys.length &&
				mapping.keys.every((key, index) => key === pendingKeys[index]),
		);
	}

	const handler: KeydownHandler = (event) => {
		if (disposed) {
			return;
		}

		if (isTextEntryTarget(event.target)) {
			clearBuffer();
			return;
		}

		const markdownEditorTarget = isMarkdownEditorTarget(event.target);

		if (markdownEditorTarget && isVimInsertModeTarget(event.target)) {
			clearBuffer();
			return;
		}

		const mappings = markdownEditorTarget
			? getMappings().filter((mapping) => mapping.requiresDomFallback)
			: getMappings();

		if (mappings.length === 0) {
			clearBuffer();
			return;
		}

		const key = normalizeKeyboardEventKey(event);

		if (key === null) {
			return;
		}

		const state = advanceKeySequence(buffer, key, mappings);
		buffer = state.buffer;

		if (state.result.type === 'pending') {
			startTimeout(state.result.commandId, event.target);
			event.preventDefault();
			event.stopPropagation();
			return;
		}

		if (state.result.type === 'matched') {
			clearBuffer();
			event.preventDefault();
			event.stopPropagation();
			onCommand(state.result.commandId);
			return;
		}

		if (state.result.type === 'cancelled') {
			clearBuffer();
			event.preventDefault();
			return;
		}

		clearBuffer();
	};

	handler.cancel = () => {
		disposed = true;
		clearBuffer();
	};

	return handler;
}

export function isTextEntryTarget(target: EventTarget | null): boolean {
	if (!target || typeof target !== 'object') {
		return false;
	}

	return isEditableTarget(target as ElementLike);
}

export function isMarkdownEditorTarget(target: EventTarget | null): boolean {
	if (!target || typeof target !== 'object') {
		return false;
	}

	return Boolean((target as ElementLike).closest?.(MARKDOWN_EDITOR_SELECTOR));
}

function isEditableTarget(element: ElementLike): boolean {
	const editable = element.closest?.(
		`${FORM_ENTRY_SELECTOR}, ${CONTENT_EDITABLE_SELECTOR}`,
	);
	return editable != null && !editable.matches?.(CODEMIRROR_CONTENT_SELECTOR);
}

interface ElementLike {
	closest?: (selector: string) => ElementLike | null;
	matches?: (selector: string) => boolean;
	ownerDocument?: Pick<Document, 'activeElement'>;
}

function isStillActiveTarget(target: EventTarget | null): boolean {
	if (!target || typeof target !== 'object') {
		return true;
	}

	const ownerDocument = (target as ElementLike).ownerDocument;
	return ownerDocument === undefined || ownerDocument.activeElement === target;
}
