import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CommandMapping } from './parser';
import { createKeydownHandler, isTextEntryTarget } from './keydown';

const mappings: CommandMapping[] = [
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

beforeEach(() => {
	vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
	vi.stubGlobal('window', { setTimeout, clearTimeout });
});

afterEach(() => {
	vi.unstubAllGlobals();
	vi.useRealTimers();
});

describe('createKeydownHandler', () => {
	it('prevents default while a sequence is pending', () => {
		const { handler, onCommand } = setupHandler();
		const event = keydownEvent({ key: ' ' });

		handler(event);

		expect(event.preventDefault).toHaveBeenCalledOnce();
		expect(onCommand).not.toHaveBeenCalled();
	});

	it('stops propagation while a sequence is pending', () => {
		const { handler } = setupHandler();
		const event = keydownEvent({ key: ' ' });

		handler(event);

		expect(event.stopPropagation).toHaveBeenCalledOnce();
	});

	it('executes and prevents default when a sequence matches', () => {
		const { handler, onCommand } = setupHandler();

		handler(keydownEvent({ key: ' ' }));
		const event = keydownEvent({ key: '/' });
		handler(event);

		expect(event.preventDefault).toHaveBeenCalledOnce();
		expect(event.stopPropagation).toHaveBeenCalledOnce();
		expect(onCommand).toHaveBeenCalledWith('global-search:open');
	});

	it('does not stop propagation when no mapping matches', () => {
		const { handler, onCommand } = setupHandler();
		const event = keydownEvent({ key: 'x' });

		handler(event);

		expect(event.stopPropagation).not.toHaveBeenCalled();
		expect(event.preventDefault).not.toHaveBeenCalled();
		expect(onCommand).not.toHaveBeenCalled();
	});

	it('executes single-key mappings', () => {
		const { handler, onCommand } = setupHandler();
		const event = keydownEvent({ key: 'H' });

		handler(event);

		expect(event.preventDefault).toHaveBeenCalledOnce();
		expect(event.stopPropagation).toHaveBeenCalledOnce();
		expect(onCommand).toHaveBeenCalledWith('workspace:previous-tab');
	});

	it('prevents default when Esc cancels an active sequence', () => {
		const { handler, onCommand } = setupHandler();

		handler(keydownEvent({ key: ' ' }));
		const event = keydownEvent({ key: 'Escape' });
		handler(event);

		expect(event.preventDefault).toHaveBeenCalledOnce();
		expect(onCommand).not.toHaveBeenCalled();
	});

	it('does not prevent default when Esc has no active sequence', () => {
		const { handler, onCommand } = setupHandler();
		const event = keydownEvent({ key: 'Escape' });

		handler(event);

		expect(event.preventDefault).not.toHaveBeenCalled();
		expect(onCommand).not.toHaveBeenCalled();
	});

	it('ignores text-entry targets', () => {
		const { handler, onCommand } = setupHandler();
		const event = keydownEvent({
			key: 'H',
			target: target({ matchesEditable: true }),
		});

		handler(event);

		expect(event.preventDefault).not.toHaveBeenCalled();
		expect(onCommand).not.toHaveBeenCalled();
	});

	it('ignores editable targets inside the markdown view', () => {
		const { handler, onCommand } = setupHandler();
		const inlineTitle = target({ markdownEditor: true, matchesEditable: true });
		const leaderEvent = keydownEvent({ key: ' ', target: inlineTitle });
		const commandEvent = keydownEvent({ key: '/', target: inlineTitle });

		handler(leaderEvent);
		handler(commandEvent);

		expect(leaderEvent.preventDefault).not.toHaveBeenCalled();
		expect(commandEvent.preventDefault).not.toHaveBeenCalled();
		expect(onCommand).not.toHaveBeenCalled();
	});

	it('ignores contenteditable targets inside the markdown view', () => {
		const { handler, onCommand } = setupHandler();
		const event = keydownEvent({
			key: 'H',
			target: target({ markdownEditor: true, contenteditable: true }),
		});

		handler(event);

		expect(event.preventDefault).not.toHaveBeenCalled();
		expect(onCommand).not.toHaveBeenCalled();
	});

	it('ignores Markdown editor keys in Vim normal mode', () => {
		const { handler, onCommand } = setupHandler();
		const event = keydownEvent({
			key: 'H',
			target: target({ markdownEditor: true }),
		});

		handler(event);

		expect(event.preventDefault).not.toHaveBeenCalled();
		expect(onCommand).not.toHaveBeenCalled();
	});

	it('handles leader mappings inside a Markdown editor in Vim normal mode', () => {
		const { handler, onCommand } = setupHandler();

		handler(
			keydownEvent({ key: ' ', target: target({ markdownEditor: true }) }),
		);
		const event = keydownEvent({
			key: '/',
			target: target({ markdownEditor: true }),
		});
		handler(event);

		expect(event.preventDefault).toHaveBeenCalledOnce();
		expect(onCommand).toHaveBeenCalledWith('global-search:open');
	});

	it('ignores leader mappings inside a Markdown editor in Vim insert mode', () => {
		const { handler, onCommand } = setupHandler(() => true);
		const event = keydownEvent({
			key: ' ',
			target: target({ markdownEditor: true }),
		});

		handler(event);

		expect(event.preventDefault).not.toHaveBeenCalled();
		expect(onCommand).not.toHaveBeenCalled();
	});
});

describe('createKeydownHandler timeout', () => {
	it('resets the buffer after the timeout expires', () => {
		const { handler, onCommand } = setupHandler();

		handler(keydownEvent({ key: ' ' }));
		vi.advanceTimersByTime(1000);
		const event = keydownEvent({ key: '/' });
		handler(event);

		expect(event.preventDefault).not.toHaveBeenCalled();
		expect(event.stopPropagation).not.toHaveBeenCalled();
		expect(onCommand).not.toHaveBeenCalled();
	});

	it('extends the timeout on each pending key', () => {
		const threeKeyMappings: CommandMapping[] = [
			{ keys: ['<Space>', 'g', 's'], commandId: 'graph:open', requiresDomFallback: true },
		];
		const onCommand = vi.fn();
		const handler = createKeydownHandler({
			getMappings: () => threeKeyMappings,
			isVimInsertModeTarget: () => false,
			onCommand,
		});

		handler(keydownEvent({ key: ' ' }));
		vi.advanceTimersByTime(800);
		handler(keydownEvent({ key: 'g' }));
		vi.advanceTimersByTime(800);
		const event = keydownEvent({ key: 's' });
		handler(event);

		expect(event.preventDefault).toHaveBeenCalledOnce();
		expect(event.stopPropagation).toHaveBeenCalledOnce();
		expect(onCommand).toHaveBeenCalledWith('graph:open');
	});

	it('executes the shorter mapping when an ambiguous sequence times out', () => {
		const { handler, onCommand } = setupHandlerWithMappings([
			{ keys: ['<Space>', 'g'], commandId: 'short', requiresDomFallback: true },
			{ keys: ['<Space>', 'g', 'g'], commandId: 'long', requiresDomFallback: true },
		]);

		handler(keydownEvent({ key: ' ' }));
		handler(keydownEvent({ key: 'g' }));
		vi.advanceTimersByTime(1000);

		expect(onCommand).toHaveBeenCalledOnce();
		expect(onCommand).toHaveBeenCalledWith('short');
	});

	it('executes the longer mapping before an ambiguous sequence times out', () => {
		const { handler, onCommand } = setupHandlerWithMappings([
			{ keys: ['<Space>', 'g'], commandId: 'short', requiresDomFallback: true },
			{ keys: ['<Space>', 'g', 'g'], commandId: 'long', requiresDomFallback: true },
		]);

		handler(keydownEvent({ key: ' ' }));
		handler(keydownEvent({ key: 'g' }));
		vi.advanceTimersByTime(800);
		handler(keydownEvent({ key: 'g' }));
		vi.advanceTimersByTime(1000);

		expect(onCommand).toHaveBeenCalledOnce();
		expect(onCommand).toHaveBeenCalledWith('long');
	});

	it('cancels an ambiguous sequence timeout when no mapping matches', () => {
		const { handler, onCommand } = setupHandlerWithMappings([
			{ keys: ['<Space>', 'g'], commandId: 'short', requiresDomFallback: true },
			{ keys: ['<Space>', 'g', 'g'], commandId: 'long', requiresDomFallback: true },
		]);

		handler(keydownEvent({ key: ' ' }));
		handler(keydownEvent({ key: 'g' }));
		handler(keydownEvent({ key: 'x' }));
		vi.advanceTimersByTime(1000);

		expect(onCommand).not.toHaveBeenCalled();
	});

	it('clears the buffer when focusing a text-entry target', () => {
		const { handler, onCommand } = setupHandler();

		handler(keydownEvent({ key: ' ' }));
		const textEvent = keydownEvent({
			key: 'a',
			target: target({ matchesEditable: true }),
		});
		handler(textEvent);
		const event = keydownEvent({ key: '/' });
		handler(event);

		expect(event.preventDefault).not.toHaveBeenCalled();
		expect(onCommand).not.toHaveBeenCalled();
	});

	it('clears the buffer when entering Vim insert mode', () => {
		let inInsertMode = false;
		const { handler, onCommand } = setupHandler(() => inInsertMode);

		handler(keydownEvent({ key: ' ', target: target({ markdownEditor: true }) }));
		inInsertMode = true;
		const insertEvent = keydownEvent({
			key: 'a',
			target: target({ markdownEditor: true }),
		});
		handler(insertEvent);
		inInsertMode = false;
		const event = keydownEvent({ key: '/', target: target({ markdownEditor: true }) });
		handler(event);

		expect(event.preventDefault).not.toHaveBeenCalled();
		expect(onCommand).not.toHaveBeenCalled();
	});
});

describe('isTextEntryTarget', () => {
	it('detects text-entry elements', () => {
		expect(isTextEntryTarget(target({ matchesEditable: true }))).toBe(
			true,
		);
		expect(isTextEntryTarget(target({ closestEditable: true }))).toBe(
			true,
		);
	});

	it('ignores non-text-entry targets', () => {
		expect(isTextEntryTarget(null)).toBe(false);
		expect(isTextEntryTarget(target())).toBe(false);
	});

	it('does not treat Markdown editor targets as text-entry elements', () => {
		expect(isTextEntryTarget(target({ markdownEditor: true }))).toBe(false);
	});

	it('does not treat the CodeMirror editor as an editable target', () => {
		expect(isTextEntryTarget(target({ isCmEditor: true }))).toBe(false);
	});

	it('does not treat the CodeMirror content area as an editable target', () => {
		expect(isTextEntryTarget(target({ isCmContent: true }))).toBe(false);
	});

	it('treats an input inside the CodeMirror editor as an editable target', () => {
		expect(
			isTextEntryTarget(
				target({ isCmEditor: true, matchesEditable: true }),
			),
		).toBe(true);
	});
});

function setupHandler(isVimInsertModeTarget = () => false) {
	return setupHandlerWithMappings(mappings, isVimInsertModeTarget);
}

function setupHandlerWithMappings(
	handlerMappings: CommandMapping[],
	isVimInsertModeTarget = () => false,
) {
	const onCommand = vi.fn();
	const handler = createKeydownHandler({
		getMappings: () => handlerMappings,
		isVimInsertModeTarget,
		onCommand,
	});

	return { handler, onCommand };
}

function keydownEvent(
	overrides: Partial<KeyboardEvent> = {},
): Pick<
	KeyboardEvent,
	| 'altKey'
	| 'ctrlKey'
	| 'key'
	| 'metaKey'
	| 'preventDefault'
	| 'stopPropagation'
	| 'target'
> {
	return {
		altKey: false,
		ctrlKey: false,
		key: '',
		metaKey: false,
		preventDefault: vi.fn(),
		stopPropagation: vi.fn(),
		target: null,
		...overrides,
	};
}

function target({
	closestEditable = false,
	markdownEditor = false,
	matchesEditable = false,
	contenteditable = false,
	isCmEditor = false,
	isCmContent = false,
}: {
	closestEditable?: boolean;
	markdownEditor?: boolean;
	matchesEditable?: boolean;
	contenteditable?: boolean;
	isCmEditor?: boolean;
	isCmContent?: boolean;
} = {}): EventTarget {
	return {
		closest: (selector: string) => {
			if (isCmContent && selector.includes('contenteditable')) {
				return { matches: (s: string) => s === '.cm-content' };
			}
			if (isCmContent && (selector.includes('markdown-source-view') || selector.includes('.cm-editor'))) return {} as Element;
			if (isCmEditor && selector.includes('.cm-editor')) return {} as Element;
			if (markdownEditor && selector.includes('markdown-source-view')) return {} as Element;
			if ((closestEditable || matchesEditable) && selector.includes('input, textarea, select')) return {} as Element;
			if (contenteditable && selector.includes('contenteditable')) return {} as Element;
			return null;
		},
	} as unknown as EventTarget;
}
