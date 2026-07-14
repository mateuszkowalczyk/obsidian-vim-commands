import type { App } from 'obsidian';
import { describe, expect, it } from 'vitest';
import { isVimInsertModeTarget } from './obsidianVim';

describe('isVimInsertModeTarget', () => {
	it('reads Vim mode from the Markdown editor containing the target', () => {
		expect(
			isVimInsertModeTarget(appWithVimInsertMode(true), markdownEditorTarget()),
		).toBe(true);
		expect(
			isVimInsertModeTarget(appWithVimInsertMode(false), markdownEditorTarget()),
		).toBe(false);
	});

	it('does not use Vim mode from another split', () => {
		const editorElement = {} as Element;
		const target = markdownEditorTarget(editorElement);
		const app = appWithViews([
			markdownView(true, {} as Element),
			markdownView(false, editorElement),
		]);

		expect(isVimInsertModeTarget(app, target)).toBe(false);
	});

	it('fails closed when editor ownership or Vim state is unknown', () => {
		expect(
			isVimInsertModeTarget(appWithViews([]), markdownEditorTarget()),
		).toBe(true);
		expect(
			isVimInsertModeTarget(
				appWithViews([markdownView(undefined)]),
				markdownEditorTarget(),
			),
		).toBe(true);
	});

	it('returns false outside Markdown editor targets', () => {
		expect(isVimInsertModeTarget(appWithVimInsertMode(true), null)).toBe(false);
	});
});

function appWithVimInsertMode(insertMode: boolean): App {
	return appWithViews([markdownView(insertMode)]);
}

function appWithViews(views: object[]): App {
	return {
		workspace: {
			getLeavesOfType: () => views.map((view) => ({ view })),
		},
	} as unknown as App;
}

function markdownView(insertMode?: boolean, ownedElement?: Element): object {
	return {
		containerEl: {
			contains: (element: Element) =>
				ownedElement === undefined || element === ownedElement,
		},
		editMode: {
			editor: {
				cm: {
					cm: {
						state: {
							vim: insertMode === undefined ? undefined : { insertMode },
						},
					},
				},
			},
		},
	};
}

function markdownEditorTarget(editorElement = {} as Element): EventTarget {
	return {
		closest: (selector: string) =>
			selector.includes('markdown-source-view') ? editorElement : null,
	} as unknown as EventTarget;
}
