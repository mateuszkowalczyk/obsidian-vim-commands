import type { App } from 'obsidian';
import { isMarkdownEditorTarget } from './keydown';

interface VimState {
	insertMode?: boolean;
}

interface CodeMirrorWithVimState {
	state?: {
		vim?: VimState | null;
	};
}

interface MarkdownViewWithCodeMirror {
	editMode?: {
		editor?: {
			cm?: {
				cm?: CodeMirrorWithVimState;
			};
		};
	};
}

interface AppWithActiveLeaf {
	workspace: {
		activeLeaf?: {
			view?: MarkdownViewWithCodeMirror;
		} | null;
	};
}

export function isVimInsertModeTarget(
	app: App,
	target: EventTarget | null,
): boolean {
	if (!isMarkdownEditorTarget(target)) {
		return false;
	}

	const view = (app as unknown as AppWithActiveLeaf).workspace.activeLeaf?.view;
	const codeMirror = view?.editMode?.editor?.cm?.cm;

	return codeMirror?.state?.vim?.insertMode === true;
}
