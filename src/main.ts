import { normalizePath, Notice, Plugin } from 'obsidian';
import { createKeydownHandler } from './keydown';
import {
	ConfigPathOutsideVaultError,
	loadMappingLines,
} from './mappings';
import { executeObsidianCommand } from './obsidianCommands';
import { isVimInsertModeTarget } from './obsidianVim';
import {
	CommandMapping,
	MappingConfigError,
	parseMappingLines,
} from './parser';
import {
	DEFAULT_SETTINGS,
	VimCommandsPluginSettings,
	VimCommandsSettingTab,
} from './settings';
import {
	VimMappingRegistry,
} from './vimMappings';
export default class VimCommandsPlugin extends Plugin {
	settings!: VimCommandsPluginSettings;
	mappings: CommandMapping[] = [];
	private reloadMappingsTimeout: number | null = null;
	private vimMappings = new VimMappingRegistry();

	async onload() {
		await this.loadSettings();
		await this.reloadMappings();

		const keydownHandler = createKeydownHandler({
			getMappings: () => this.mappings,
			isVimInsertModeTarget: (target) =>
				isVimInsertModeTarget(this.app, target),
			onCommand: (commandId) => {
				executeObsidianCommand(this.app, commandId);
			},
		});
		this.register(() => keydownHandler.cancel());
		this.registerDomEvent(
			window,
			'keydown',
			keydownHandler,
			{ capture: true },
		);

		this.app.workspace.onLayoutReady(() => this.syncVimMappings());
		this.registerEvent(
			this.app.workspace.on('active-leaf-change', () =>
				this.syncVimMappings(),
			),
		);
		this.addSettingTab(new VimCommandsSettingTab(this.app, this));
	}

	onunload() {
		this.clearReloadMappingsTimeout();
		this.vimMappings.clear();
	}

	async loadSettings() {
		try {
			this.settings = Object.assign(
				{},
				DEFAULT_SETTINGS,
				(await this.loadData()) as Partial<VimCommandsPluginSettings>,
			);
		} catch (error) {
			this.settings = { ...DEFAULT_SETTINGS };
			this.reportError(
				'Could not load Vim commands settings. Using defaults.',
				error,
			);
		}
	}

	async saveSettings(): Promise<boolean> {
		try {
			await this.saveData(this.settings);
			return true;
		} catch (error) {
			this.reportError('Could not save Vim commands settings.', error);
			return false;
		}
	}

	reloadMappingsDebounced(delayMs = 2000) {
		this.clearReloadMappingsTimeout();

		this.reloadMappingsTimeout = window.setTimeout(() => {
			this.reloadMappingsTimeout = null;
			void this.reloadMappings();
		}, delayMs);
	}

	private clearReloadMappingsTimeout() {
		if (this.reloadMappingsTimeout === null) {
			return;
		}

		window.clearTimeout(this.reloadMappingsTimeout);
		this.reloadMappingsTimeout = null;
	}

	async reloadMappings() {
		try {
			const mappingLines = await loadMappingLines(
				this.app.vault,
				this.settings.configFilePath,
			);

			if (mappingLines === null) {
				const path = normalizePath(
					this.settings.configFilePath.trim() || DEFAULT_SETTINGS.configFilePath,
				);
				new Notice(`Vim commands config file not found: ${path}`);
				return;
			}

			const mappings = parseMappingLines(mappingLines);
			this.vimMappings.replace(
				mappings,
				this.mappings,
				(commandId) => executeObsidianCommand(this.app, commandId),
			);
			this.mappings = mappings;
		} catch (error) {
			if (
				error instanceof ConfigPathOutsideVaultError ||
				error instanceof MappingConfigError
			) {
				this.reportError(error.message, error);
				return;
			}

			this.reportError(
				'Could not reload Vim commands mappings. Keeping the previous mappings.',
				error,
			);
		}
	}

	private syncVimMappings() {
		try {
			this.vimMappings.sync(this.mappings, (commandId) =>
				executeObsidianCommand(this.app, commandId),
			);
		} catch (error) {
			this.reportError('Could not enable Vim commands in the editor.', error);
		}
	}

	private reportError(message: string, error: unknown) {
		console.error(message, error);
		new Notice(message);
	}
}
