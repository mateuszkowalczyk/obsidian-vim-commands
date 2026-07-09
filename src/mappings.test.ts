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
});

function vaultWithAdapter(adapter: unknown): Vault {
	return { adapter } as Vault;
}
