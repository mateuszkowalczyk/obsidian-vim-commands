import { Plugin } from 'obsidian';
import { loadMappingLines } from './mappings';
import { CommandMapping, parseMappingLines } from './parser';
import {
	DEFAULT_SETTINGS,
	VimCommandsPluginSettings,
	VimCommandsSettingTab,
} from './settings';

export default class VimCommandsPlugin extends Plugin {
	settings!: VimCommandsPluginSettings;
	mappings: CommandMapping[] = [];

	async onload() {
		await this.loadSettings();
		await this.reloadMappings();

		this.addSettingTab(new VimCommandsSettingTab(this.app, this));
	}

	onunload() { }

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

	async reloadMappings() {
		const mappingLines = await loadMappingLines(
			this.app.vault,
			this.settings.configFilePath,
		);
		this.mappings = parseMappingLines(mappingLines);
	}
}
