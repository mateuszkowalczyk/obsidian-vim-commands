import type { Vault } from 'obsidian';
import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_CONFIG_FILE_PATH, loadMappingLines } from './mappings';

vi.mock('obsidian', () => ({
	normalizePath: (path: string) => path.replace(/\/+/g, '/'),
}));

describe('loadMappingLines', () => {
	it('reports a missing config file', async () => {
		const vault = vaultWithAdapter({
			exists: vi.fn().mockResolvedValue(false),
			read: vi.fn(),
		});

		await expect(loadMappingLines(vault, '.vimrc')).resolves.toBeNull();
	});

	it('loads lines from an existing config file', async () => {
		const vault = vaultWithAdapter({
			exists: vi.fn().mockResolvedValue(true),
			read: vi.fn().mockResolvedValue('nmap H :obcommand workspace:previous-tab<CR>\n'),
		});

		await expect(loadMappingLines(vault, 'vim/.vimrc')).resolves.toEqual([
			'nmap H :obcommand workspace:previous-tab<CR>',
			'',
		]);
	});

	it('uses the default config path when the configured path is blank', async () => {
		const exists = vi.fn().mockResolvedValue(false);
		const vault = vaultWithAdapter({
			exists,
			read: vi.fn(),
		});

		await loadMappingLines(vault, '   ');

		expect(exists).toHaveBeenCalledWith(DEFAULT_CONFIG_FILE_PATH);
	});

	it.each([
		'/tmp/vimrc',
		'\\\\server\\share\\vimrc',
		'C:\\Users\\user\\vimrc',
		'../vimrc',
		'config/../../vimrc',
		'config\\..\\vimrc',
	])('rejects paths outside the vault: %s', async (path) => {
		const exists = vi.fn();
		const read = vi.fn();
		const vault = vaultWithAdapter({ exists, read });

		await expect(loadMappingLines(vault, path)).rejects.toThrow(
			'Config file path must stay within the vault.',
		);
		expect(exists).not.toHaveBeenCalled();
		expect(read).not.toHaveBeenCalled();
	});

	it('allows filenames containing two dots', async () => {
		const exists = vi.fn().mockResolvedValue(false);
		const vault = vaultWithAdapter({
			exists,
			read: vi.fn(),
		});

		await loadMappingLines(vault, 'config/vim..rc');

		expect(exists).toHaveBeenCalledWith('config/vim..rc');
	});

	it('propagates adapter failures to the reload boundary', async () => {
		const error = new Error('vault unavailable');
		const vault = vaultWithAdapter({
			exists: vi.fn().mockRejectedValue(error),
			read: vi.fn(),
		});

		await expect(loadMappingLines(vault, '.vimrc')).rejects.toBe(error);
	});
});

function vaultWithAdapter(adapter: unknown): Vault {
	return { adapter } as Vault;
}
