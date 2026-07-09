import { describe, expect, it, vi } from 'vitest';
import { CommandMapping } from './parser';
import { createKeydownHandler, shouldIgnoreKeydownTarget } from './keydown';

const mappings: CommandMapping[] = [
	{ keys: ['<Space>', '/'], commandId: 'global-search:open' },
	{ keys: ['H'], commandId: 'workspace:previous-tab' },
];

describe('createKeydownHandler', () => {
	it('prevents default while a sequence is pending', () => {
		const { handler, onCommand } = setupHandler();
		const event = keydownEvent({ key: ' ' });

		handler(event);

		expect(event.preventDefault).toHaveBeenCalledOnce();
		expect(onCommand).not.toHaveBeenCalled();
	});

	it('executes and prevents default when a sequence matches', () => {
		const { handler, onCommand } = setupHandler();

		handler(keydownEvent({ key: ' ' }));
		const event = keydownEvent({ key: '/' });
		handler(event);

		expect(event.preventDefault).toHaveBeenCalledOnce();
		expect(onCommand).toHaveBeenCalledWith('global-search:open');
	});

	it('executes single-key mappings', () => {
		const { handler, onCommand } = setupHandler();
		const event = keydownEvent({ key: 'H' });

		handler(event);

		expect(event.preventDefault).toHaveBeenCalledOnce();
		expect(onCommand).toHaveBeenCalledWith('workspace:previous-tab');
	});

	it('does not prevent default when no mapping matches', () => {
		const { handler, onCommand } = setupHandler();
		const event = keydownEvent({ key: 'x' });

		handler(event);

		expect(event.preventDefault).not.toHaveBeenCalled();
		expect(onCommand).not.toHaveBeenCalled();
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

	it('allows mappings inside a Markdown editor in Vim normal mode', () => {
		const { handler, onCommand } = setupHandler();
		const event = keydownEvent({
			key: 'H',
			target: target({ markdownEditor: true }),
		});

		handler(event);

		expect(event.preventDefault).toHaveBeenCalledOnce();
		expect(onCommand).toHaveBeenCalledWith('workspace:previous-tab');
	});

	it('ignores Markdown editor keys when Vim is in insert mode', () => {
		const { handler, onCommand } = setupHandler(() => true);
		const event = keydownEvent({
			key: 'H',
			target: target({ markdownEditor: true }),
		});

		handler(event);

		expect(event.preventDefault).not.toHaveBeenCalled();
		expect(onCommand).not.toHaveBeenCalled();
	});
});

describe('shouldIgnoreKeydownTarget', () => {
	it('detects text-entry elements', () => {
		expect(shouldIgnoreKeydownTarget(target({ matchesEditable: true }))).toBe(
			true,
		);
		expect(shouldIgnoreKeydownTarget(target({ closestEditable: true }))).toBe(
			true,
		);
	});

	it('ignores non-text-entry targets', () => {
		expect(shouldIgnoreKeydownTarget(null)).toBe(false);
		expect(shouldIgnoreKeydownTarget(target())).toBe(false);
	});

	it('allows Markdown editor targets unless Vim insert mode is reported', () => {
		expect(shouldIgnoreKeydownTarget(target({ markdownEditor: true }))).toBe(
			false,
		);
		expect(
			shouldIgnoreKeydownTarget(target({ markdownEditor: true }), () => true),
		).toBe(true);
		expect(
			shouldIgnoreKeydownTarget(target({ markdownEditor: true }), () => false),
		).toBe(
			false,
		);
	});
});

function setupHandler(
	isVimInsertModeTarget = () => false,
) {
	const onCommand = vi.fn();
	const handler = createKeydownHandler({
		getMappings: () => mappings,
		isVimInsertModeTarget,
		onCommand,
	});

	return { handler, onCommand };
}

function keydownEvent(
	overrides: Partial<KeyboardEvent> = {},
): Pick<
	KeyboardEvent,
	'altKey' | 'ctrlKey' | 'key' | 'metaKey' | 'preventDefault' | 'target'
> {
	return {
		altKey: false,
		ctrlKey: false,
		key: '',
		metaKey: false,
		preventDefault: vi.fn(),
		target: null,
		...overrides,
	};
}

function target({
	closestEditable = false,
	markdownEditor = false,
	matchesEditable = false,
}: {
	closestEditable?: boolean;
	markdownEditor?: boolean;
	matchesEditable?: boolean;
} = {}): EventTarget {
	return {
		closest: (selector: string) =>
			(markdownEditor && selector.includes('markdown-source-view')) ||
			(closestEditable && selector.includes('input, textarea, select'))
				? ({} as Element)
				: null,
		matches: (selector: string) =>
			matchesEditable && selector.includes('input, textarea, select'),
	} as unknown as EventTarget;
}
