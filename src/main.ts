import { Plugin } from 'obsidian';
import { loadMappings } from './mappings';
import {
	DEFAULT_SETTINGS,
	VimCommandsPluginSettings,
	VimCommandsSettingTab,
} from './settings';

export default class VimCommandsPlugin extends Plugin {
	settings!: VimCommandsPluginSettings;
	mappingLines: string[] = [];

	async onload() {
		await this.loadSettings();
		this.mappingLines = await loadMappings(
			this.app.vault,
			this.settings.configFilePath,
		);

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
}
