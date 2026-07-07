import { normalizePath, type Vault } from 'obsidian';

export const DEFAULT_CONFIG_FILE_PATH = '.vimrc';

export async function loadMappingLines(
	vault: Vault,
	configFilePath = DEFAULT_CONFIG_FILE_PATH,
): Promise<string[]> {
	const path = normalizePath(configFilePath.trim() || DEFAULT_CONFIG_FILE_PATH);

	if (!(await vault.adapter.exists(path))) {
		return [];
	}

	const contents = await vault.adapter.read(path);
	return contents.split(/\r?\n/);
}
