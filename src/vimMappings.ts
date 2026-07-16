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
		extra: { context: 'normal' },
	): void;
	unmap(keys: string, context: 'normal'): void;
}

export interface VimMappingRegistration {
	keys: string;
	actionName: string;
}

const NOOP_ACTION = () => {};

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
	private registrations: VimMappingRegistration[] = [];
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
		this.registrations = registerVimMappings(
			vim,
			mappings.filter((mapping) => !mapping.requiresDomFallback),
			onCommand,
		);
		this.registered = true;
	}

	replace(
		mappings: CommandMapping[],
		previousMappings: CommandMapping[],
		onCommand: (commandId: string) => void,
	): void {
		this.clear();

		try {
			this.sync(mappings, onCommand);
		} catch (error) {
			this.sync(previousMappings, onCommand);
			throw error;
		}
	}

	clear(): void {
		if (!this.vim || !this.registered) {
			return;
		}

		unregisterVimMappings(this.vim, this.registrations);
		this.vim = null;
		this.registrations = [];
		this.registered = false;
	}
}

export function registerVimMappings(
	vim: CodeMirrorVim,
	mappings: CommandMapping[],
	onCommand: (commandId: string) => void,
): VimMappingRegistration[] {
	const registrations: VimMappingRegistration[] = [];

	try {
		for (const [index, mapping] of mappings.entries()) {
			const actionName = `obsidian-vim-commands-${index}`;
			const keys = mapping.keys.join('');

			vim.defineAction(actionName, () => onCommand(mapping.commandId));
			// mapCommand inserts ahead of CodeMirror's single-key defaults, preserving prefixes.
			vim.mapCommand(keys, 'action', actionName, undefined, {
				context: 'normal',
			});
			registrations.push({ keys, actionName });
		}
	} catch (error) {
		unregisterVimMappings(vim, registrations);
		throw error;
	}

	return registrations;
}

export function unregisterVimMappings(
	vim: CodeMirrorVim,
	registrations: VimMappingRegistration[],
): void {
	for (const { actionName } of registrations) {
		vim.defineAction(actionName, NOOP_ACTION);
	}

	// CodeMirror prepends mappings, so unwind ours in the opposite order.
	for (const { keys } of [...registrations].reverse()) {
		vim.unmap(keys, 'normal');
	}
}
