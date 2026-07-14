import { normalizePath, type Vault } from 'obsidian';

export const DEFAULT_CONFIG_FILE_PATH = '.vimrc';

export class ConfigPathOutsideVaultError extends Error {
	constructor() {
		super('Config file path must stay within the vault.');
		this.name = 'ConfigPathOutsideVaultError';
	}
}

export async function loadMappingLines(
	vault: Vault,
	configFilePath = DEFAULT_CONFIG_FILE_PATH,
): Promise<string[] | null> {
	const configuredPath = configFilePath.trim() || DEFAULT_CONFIG_FILE_PATH;
	assertVaultRelativePath(configuredPath);
	const path = normalizePath(configuredPath);

	if (!(await vault.adapter.exists(path))) {
		return null;
	}

	const contents = await vault.adapter.read(path);
	return contents.split(/\r?\n/);
}

function assertVaultRelativePath(path: string): void {
	if (
		path.startsWith('/') ||
		path.startsWith('\\') ||
		/^[A-Za-z]:/.test(path) ||
		path.split(/[\\/]/).includes('..')
	) {
		throw new ConfigPathOutsideVaultError();
	}
}
