import { CommandMapping } from './parser';

export interface CodeMirrorVim {
	defineAction(
		name: string,
		action: (codeMirror: unknown, actionArgs: unknown) => void,
	): void;
	mapCommand(
		keys: string,
		type: 'action',
		name: string,
		actionArgs: undefined,
		extra: Record<string, never>,
	): void;
	unmap(keys: string, context: 'normal'): void;
}

declare global {
	interface Window {
		CodeMirrorAdapter?: {
			Vim?: CodeMirrorVim;
		};
	}
}

export function getCodeMirrorVim(): CodeMirrorVim | null {
	return window.CodeMirrorAdapter?.Vim ?? null;
}

export class VimMappingRegistry {
	private vim: CodeMirrorVim | null = null;
	private mappingKeys: string[] = [];
	private registered = false;

	constructor(
		private readonly getVim: () => CodeMirrorVim | null = getCodeMirrorVim,
	) {}

	sync(
		mappings: CommandMapping[],
		onCommand: (commandId: string) => void,
	): void {
		const vim = this.getVim();

		if (!vim || (this.vim === vim && this.registered)) {
			return;
		}

		this.clear();
		this.vim = vim;
		this.mappingKeys = registerVimMappings(
			vim,
			mappings.filter((mapping) => !mapping.requiresDomFallback),
			onCommand,
		);
		this.registered = true;
	}

	clear(): void {
		if (!this.vim || !this.registered) {
			return;
		}

		unregisterVimMappings(this.vim, this.mappingKeys);
		this.vim = null;
		this.mappingKeys = [];
		this.registered = false;
	}
}

export function registerVimMappings(
	vim: CodeMirrorVim,
	mappings: CommandMapping[],
	onCommand: (commandId: string) => void,
): string[] {
	return mappings.map((mapping, index) => {
		const actionName = `obsidian-vim-commands-${index}`;
		const keys = mapping.keys.join('');

		vim.defineAction(actionName, () => onCommand(mapping.commandId));
		// mapCommand inserts ahead of CodeMirror's single-key defaults, preserving prefixes.
		vim.mapCommand(keys, 'action', actionName, undefined, {});

		return keys;
	});
}

export function unregisterVimMappings(
	vim: CodeMirrorVim,
	keys: string[],
): void {
	for (const keySequence of keys) {
		vim.unmap(keySequence, 'normal');
	}
}
