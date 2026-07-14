import { describe, expect, it, vi } from 'vitest';
import {
	CodeMirrorVim,
	registerVimMappings,
	unregisterVimMappings,
	VimMappingRegistry,
} from './vimMappings';

type VimAction = Parameters<CodeMirrorVim['defineAction']>[1];

describe('registerVimMappings', () => {
	it('registers each supported mapping as a normal-mode Vim action', () => {
		const { vim, defineAction, mapCommand } = vimApi();
		const onCommand = vi.fn();

		const keys = registerVimMappings(
			vim,
			[
				{
					keys: ['g', 'd'],
					commandId: 'editor:follow-link',
					requiresDomFallback: false,
				},
				{
					keys: ['<Space>', 'g', 'g'],
					commandId: 'obsidian-git:open-git-view',
					requiresDomFallback: true,
				},
			],
			onCommand,
		);

		expect(keys).toEqual(['gd', '<Space>gg']);
		expect(mapCommand).toHaveBeenNthCalledWith(
			1,
			'gd',
			'action',
			'obsidian-vim-commands-0',
			undefined,
			{},
		);
		expect(mapCommand).toHaveBeenNthCalledWith(
			2,
			'<Space>gg',
			'action',
			'obsidian-vim-commands-1',
			undefined,
			{},
		);

		const action = defineAction.mock.calls[0]?.[1];
		action?.({}, undefined);
		expect(onCommand).toHaveBeenCalledWith('editor:follow-link');
	});
});

describe('unregisterVimMappings', () => {
	it('removes only the recorded normal-mode mappings', () => {
		const { vim, unmap } = vimApi();

		unregisterVimMappings(vim, ['gd', '<Space>gg']);

		expect(unmap).toHaveBeenCalledWith('gd', 'normal');
		expect(unmap).toHaveBeenCalledWith('<Space>gg', 'normal');
	});
});

describe('VimMappingRegistry', () => {
	it('registers only mappings without a DOM fallback and clears them on demand', () => {
		const { vim, mapCommand, unmap } = vimApi();
		const registry = new VimMappingRegistry(() => vim);

		registry.sync(
			[
				{
					keys: ['g', 'd'],
					commandId: 'editor:follow-link',
					requiresDomFallback: false,
				},
				{
					keys: ['<Space>', 'g', 'g'],
					commandId: 'obsidian-git:open-git-view',
					requiresDomFallback: true,
				},
			],
			vi.fn(),
		);

		expect(mapCommand).toHaveBeenCalledOnce();
		expect(mapCommand).toHaveBeenCalledWith(
			'gd',
			'action',
			'obsidian-vim-commands-0',
			undefined,
			{},
		);

		registry.clear();

		expect(unmap).toHaveBeenCalledWith('gd', 'normal');
	});

	it('restores previous mappings when a replacement fails', () => {
		const { vim, mapCommand, unmap } = vimApi();
		const registry = new VimMappingRegistry(() => vim);
		const previousMapping = {
			keys: ['g', 'd'],
			commandId: 'editor:follow-link',
			requiresDomFallback: false,
		};
		const error = new Error('mapping failed');

		registry.sync([previousMapping], vi.fn());
		mapCommand.mockImplementation((keys) => {
			if (keys === 'H') {
				throw error;
			}
		});

		expect(() =>
			registry.replace(
				[
					{
						keys: ['H'],
						commandId: 'workspace:previous-tab',
						requiresDomFallback: false,
					},
				],
				[previousMapping],
				vi.fn(),
			),
		).toThrow(error);
		expect(mapCommand.mock.calls.map(([keys]) => keys)).toEqual([
			'gd',
			'H',
			'gd',
		]);
		expect(unmap).toHaveBeenCalledWith('gd', 'normal');
	});
});

function vimApi() {
	const defineAction = vi.fn<(name: string, action: VimAction) => void>();
	const mapCommand = vi.fn<CodeMirrorVim['mapCommand']>();
	const unmap = vi.fn<CodeMirrorVim['unmap']>();
	const vim: CodeMirrorVim = { defineAction, mapCommand, unmap };

	return { vim, defineAction, mapCommand, unmap };
}
