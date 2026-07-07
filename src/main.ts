import { Plugin } from 'obsidian';
import { loadMappings } from './mappings';
import { ParsedNmapObcommandLine, parseMappingLines } from './parser';
import {
	DEFAULT_SETTINGS,
	VimCommandsPluginSettings,
	VimCommandsSettingTab,
} from './settings';

export default class VimCommandsPlugin extends Plugin {
	settings!: VimCommandsPluginSettings;
	mappings: ParsedNmapObcommandLine[] = [];

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
		const mappingLines = await loadMappings(
			this.app.vault,
			this.settings.configFilePath,
		);
		this.mappings = parseMappingLines(mappingLines);
	}
}
