import { App, PluginSettingTab, Setting } from 'obsidian';
import VimCommandsPlugin from './main';
import { DEFAULT_CONFIG_FILE_PATH, loadMappings } from './mappings';

export interface VimCommandsPluginSettings {
	configFilePath: string;
}

export const DEFAULT_SETTINGS: VimCommandsPluginSettings = {
	configFilePath: DEFAULT_CONFIG_FILE_PATH,
};

export class VimCommandsSettingTab extends PluginSettingTab {
	plugin: VimCommandsPlugin;

	constructor(app: App, plugin: VimCommandsPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Config file path')
			.setDesc('Path to the vimrc-style command mapping file in this vault.')
			.addText((text) =>
				text
					.setPlaceholder(DEFAULT_CONFIG_FILE_PATH)
					.setValue(this.plugin.settings.configFilePath)
					.onChange(async (value) => {
						this.plugin.settings.configFilePath = value;
						await this.plugin.saveSettings();
						this.plugin.mappingLines = await loadMappings(
							this.app.vault,
							this.plugin.settings.configFilePath,
						);
					}),
			);
	}
}
