import type { App } from 'obsidian';
import { isMarkdownEditorTarget } from './keydown';

interface VimState {
	insertMode?: boolean;
}

interface AppWithActiveLeaf {
	workspace: {
		activeLeaf?: {
			view?: {
				editMode?: {
					editor?: {
						cm?: {
							cm?: { state?: { vim?: VimState | null } };
						};
					};
				};
			};
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
	return view?.editMode?.editor?.cm?.cm?.state?.vim?.insertMode === true;
}
