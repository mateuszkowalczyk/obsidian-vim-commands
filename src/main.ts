import { normalizePath, Notice, Plugin } from 'obsidian';
import { createKeydownHandler } from './keydown';
import { loadMappingLines } from './mappings';
import { executeObsidianCommand } from './obsidianCommands';
import { isVimInsertModeTarget } from './obsidianVim';
import { CommandMapping, parseMappingLines } from './parser';
import {
	DEFAULT_SETTINGS,
	VimCommandsPluginSettings,
	VimCommandsSettingTab,
} from './settings';
export default class VimCommandsPlugin extends Plugin {
	settings!: VimCommandsPluginSettings;
	mappings: CommandMapping[] = [];
	private reloadMappingsTimeout: number | null = null;

	async onload() {
		await this.loadSettings();
		await this.reloadMappings();

		this.registerDomEvent(
			window,
			'keydown',
			createKeydownHandler({
				getMappings: () => this.mappings,
				isVimInsertModeTarget: (target) =>
					isVimInsertModeTarget(this.app, target),
				onCommand: (commandId) => {
					executeObsidianCommand(this.app, commandId);
				},
			}),
		);

		this.addSettingTab(new VimCommandsSettingTab(this.app, this));
	}

	onunload() {
		this.clearReloadMappingsTimeout();
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			(await this.loadData()) as Partial<VimCommandsPluginSettings>,
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	reloadMappingsDebounced(delayMs = 1000) {
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
		const mappingLines = await loadMappingLines(
			this.app.vault,
			this.settings.configFilePath,
		);

		if (mappingLines === null) {
			const path = normalizePath(
				this.settings.configFilePath.trim() || DEFAULT_SETTINGS.configFilePath,
			);
			new Notice(`Vim commands config file not found: ${path}`);
			this.mappings = [];
			return;
		}

		this.mappings = parseMappingLines(mappingLines);
	}
}
