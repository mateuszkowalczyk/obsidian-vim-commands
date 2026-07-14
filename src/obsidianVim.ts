import type { App } from 'obsidian';
import { isMarkdownEditorTarget } from './keydown';

interface VimState {
	insertMode?: boolean;
}

interface MarkdownViewLike {
	containerEl?: {
		contains?: (element: Element) => boolean;
	};
	editMode?: {
		editor?: {
			cm?: {
				cm?: { state?: { vim?: VimState | null } };
			};
		};
	};
}

interface AppWithMarkdownLeaves {
	workspace: {
		getLeavesOfType?: (viewType: string) => Array<{ view?: MarkdownViewLike }>;
	};
}

export function isVimInsertModeTarget(
	app: App,
	target: EventTarget | null,
): boolean {
	if (!isMarkdownEditorTarget(target)) {
		return false;
	}

	const editorElement = (target as Element).closest('.markdown-source-view');
	if (editorElement === null) {
		return true;
	}

	const leaves = (app as unknown as AppWithMarkdownLeaves).workspace
		.getLeavesOfType?.('markdown') ?? [];
	const view = leaves
		.map((leaf) => leaf.view)
		.find((candidate) =>
			candidate?.containerEl?.contains?.(editorElement) === true,
		);
	const insertMode = view?.editMode?.editor?.cm?.cm?.state?.vim?.insertMode;

	// Unknown ownership or private Vim state must not intercept editor typing.
	return insertMode ?? true;
}
