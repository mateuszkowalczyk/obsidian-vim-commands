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

		const registrations = registerVimMappings(
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

		expect(registrations).toEqual([
			{ keys: 'gd', actionName: 'obsidian-vim-commands-0' },
			{ keys: '<Space>gg', actionName: 'obsidian-vim-commands-1' },
		]);
		expect(mapCommand).toHaveBeenNthCalledWith(
			1,
			'gd',
			'action',
			'obsidian-vim-commands-0',
			undefined,
			{ context: 'normal' },
		);
		expect(mapCommand).toHaveBeenNthCalledWith(
			2,
			'<Space>gg',
			'action',
			'obsidian-vim-commands-1',
			undefined,
			{ context: 'normal' },
		);

		const action = defineAction.mock.calls[0]?.[1];
		action?.({}, undefined);
		expect(onCommand).toHaveBeenCalledWith('editor:follow-link');
	});
});

describe('unregisterVimMappings', () => {
	it('detaches callbacks and removes mappings in reverse registration order', () => {
		const { vim, defineAction, unmap } = vimApi();

		unregisterVimMappings(vim, [
			{ keys: 'gd', actionName: 'obsidian-vim-commands-0' },
			{ keys: '<Space>gg', actionName: 'obsidian-vim-commands-1' },
		]);

		expect(defineAction).toHaveBeenCalledTimes(2);
		expect(unmap.mock.calls).toEqual([
			['<Space>gg', 'normal'],
			['gd', 'normal'],
		]);
	});

	it('restores a pre-existing normal-mode mapping', () => {
		const mappings = [
			{ keys: 'gd', context: 'normal', owner: 'other-plugin' },
		];
		const { vim } = vimApi({ mappings });

		const registrations = registerVimMappings(vim, [
			{
				keys: ['g', 'd'],
				commandId: 'editor:follow-link',
				requiresDomFallback: false,
			},
		], vi.fn());
		unregisterVimMappings(vim, registrations);

		expect(mappings).toEqual([
			{ keys: 'gd', context: 'normal', owner: 'other-plugin' },
		]);
	});

	it('releases command callbacks when mappings are removed', () => {
		const { vim, actions } = vimApi();
		const onCommand = vi.fn();
		const registrations = registerVimMappings(vim, [
			{
				keys: ['g', 'd'],
				commandId: 'editor:follow-link',
				requiresDomFallback: false,
			},
		], onCommand);
		const registration = registrations[0];
		if (!registration) {
			throw new Error('Expected a Vim mapping registration.');
		}
		const { actionName } = registration;
		const registeredAction = actions.get(actionName);

		unregisterVimMappings(vim, registrations);
		actions.get(actionName)?.({}, undefined);

		expect(actions.get(actionName)).not.toBe(registeredAction);
		expect(onCommand).not.toHaveBeenCalled();
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
			{ context: 'normal' },
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

function vimApi(options: { mappings?: Array<Record<string, unknown>> } = {}) {
	const mappings = options.mappings;
	const actions = new Map<string, VimAction>();
	const defineAction = vi.fn<(name: string, action: VimAction) => void>(
		(name, action) => actions.set(name, action),
	);
	const mapCommand = vi.fn<CodeMirrorVim['mapCommand']>(
		(keys, type, name, actionArgs, extra) => {
			mappings?.unshift({
				keys,
				type,
				[type]: name,
				actionArgs,
				...extra,
			});
		},
	);
	const unmap = vi.fn<CodeMirrorVim['unmap']>((keys, context) => {
		const index = mappings?.findIndex(
			(mapping) => mapping.keys === keys && mapping.context === context,
		) ?? -1;
		if (index >= 0) {
			mappings?.splice(index, 1);
		}
	});
	const vim: CodeMirrorVim = { defineAction, mapCommand, unmap };

	return { vim, actions, defineAction, mapCommand, unmap };
}
