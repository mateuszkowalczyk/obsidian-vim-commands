import type { App, PluginManifest, Vault } from 'obsidian';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import VimCommandsPlugin from './main';

const mocks = vi.hoisted(() => ({
	notice: vi.fn(),
}));

vi.mock('obsidian', () => ({
	normalizePath: (path: string) => path,
	Notice: mocks.notice,
	Plugin: class {},
	PluginSettingTab: class {},
	Setting: class {},
	SettingGroup: class {},
}));

describe('VimCommandsPlugin failure handling', () => {
	beforeEach(() => {
		mocks.notice.mockClear();
		vi.spyOn(console, 'error').mockImplementation(() => undefined);
	});

	it('uses defaults when persisted settings cannot be loaded', async () => {
		const plugin = createPlugin();
		plugin.loadData = vi.fn().mockRejectedValue(new Error('storage failed'));

		await expect(plugin.loadSettings()).resolves.toBeUndefined();

		expect(plugin.settings).toEqual({ configFilePath: '.vimrc' });
		expect(mocks.notice).toHaveBeenCalledWith(
			'Could not load Vim commands settings. Using defaults.',
		);
	});

	it('contains save failures and reports them', async () => {
		const plugin = createPlugin();
		plugin.settings = { configFilePath: 'vim/vimrc' };
		plugin.saveData = vi.fn().mockRejectedValue(new Error('storage failed'));

		await expect(plugin.saveSettings()).resolves.toBe(false);
		expect(mocks.notice).toHaveBeenCalledWith(
			'Could not save Vim commands settings.',
		);
	});

	it('keeps valid mappings when the vault cannot be read', async () => {
		const plugin = createPlugin();
		const previousMappings = [
			{
				keys: ['g', 'd'],
				commandId: 'editor:follow-link',
				requiresDomFallback: false,
			},
		];
		plugin.settings = { configFilePath: '.vimrc' };
		plugin.mappings = previousMappings;
		plugin.app = {
			vault: vaultWithAdapter({
				exists: vi.fn().mockRejectedValue(new Error('vault unavailable')),
			}),
		} as VimCommandsPlugin['app'];

		await expect(plugin.reloadMappings()).resolves.toBeUndefined();

		expect(plugin.mappings).toBe(previousMappings);
		expect(mocks.notice).toHaveBeenCalledWith(
			'Could not reload Vim commands mappings. Keeping the previous mappings.',
		);
	});

	it('reports when the config path escapes the vault without reading it', async () => {
		const plugin = createPlugin();
		const exists = vi.fn();
		const read = vi.fn();
		plugin.settings = { configFilePath: '../obsidian.vimrc' };
		plugin.app = {
			vault: vaultWithAdapter({ exists, read }),
		} as VimCommandsPlugin['app'];

		await expect(plugin.reloadMappings()).resolves.toBeUndefined();

		expect(mocks.notice).toHaveBeenCalledWith(
			'Config file path must stay within the vault.',
		);
		expect(exists).not.toHaveBeenCalled();
		expect(read).not.toHaveBeenCalled();
	});

	it('reports malformed config lines with their line number', async () => {
		const plugin = createPlugin();
		plugin.settings = { configFilePath: '.vimrc' };
		plugin.app = {
			vault: vaultWithAdapter({
				exists: vi.fn().mockResolvedValue(true),
				read: vi.fn().mockResolvedValue(
					'set tabstop=4\nnmap H :obcommand workspace:previous-tab<cr>',
				),
			}),
		} as VimCommandsPlugin['app'];

		await expect(plugin.reloadMappings()).resolves.toBeUndefined();

		expect(mocks.notice).toHaveBeenCalledWith(
			'Invalid Vim command mapping on line 2.',
		);
	});
});

function createPlugin(): VimCommandsPlugin {
	return new VimCommandsPlugin({} as App, {} as PluginManifest);
}

function vaultWithAdapter(adapter: unknown): Vault {
	return { adapter } as Vault;
}
