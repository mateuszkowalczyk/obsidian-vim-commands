import type { App } from 'obsidian';
import { describe, expect, it } from 'vitest';
import { isVimInsertModeTarget } from './obsidianVim';

describe('isVimInsertModeTarget', () => {
	it('reads the active Markdown editor Vim mode', () => {
		expect(
			isVimInsertModeTarget(appWithVimInsertMode(true), markdownEditorTarget()),
		).toBe(true);
		expect(
			isVimInsertModeTarget(appWithVimInsertMode(false), markdownEditorTarget()),
		).toBe(false);
	});

	it('returns false outside Markdown editor targets', () => {
		expect(isVimInsertModeTarget(appWithVimInsertMode(true), null)).toBe(false);
	});
});

function appWithVimInsertMode(insertMode: boolean): App {
	return {
		workspace: {
			activeLeaf: {
				view: {
					editMode: {
						editor: {
							cm: { cm: { state: { vim: { insertMode } } } },
						},
					},
				},
			},
		},
	} as unknown as App;
}

function markdownEditorTarget(): EventTarget {
	return {
		closest: (selector: string) =>
			selector.includes('markdown-source-view') ? ({} as Element) : null,
	} as unknown as EventTarget;
}
