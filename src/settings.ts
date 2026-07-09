import { App, PluginSettingTab, Setting } from 'obsidian';
import VimCommandsPlugin from './main';
import { DEFAULT_CONFIG_FILE_PATH } from './mappings';

export interface VimCommandsPluginSettings {
	configFilePath: string;
}

export const DEFAULT_SETTINGS: VimCommandsPluginSettings = {
	configFilePath: DEFAULT_CONFIG_FILE_PATH,
};

const CONFIG_FILE_PATH_NAME = 'Config file path';
const CONFIG_FILE_PATH_DESC = 'Path to the vimrc-style command mapping file in this vault.';

export class VimCommandsSettingTab extends PluginSettingTab {
	plugin: VimCommandsPlugin;

	constructor(app: App, plugin: VimCommandsPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	getSettingDefinitions(): unknown[] {
		return [
			{
				name: CONFIG_FILE_PATH_NAME,
				desc: CONFIG_FILE_PATH_DESC,
				render: (setting: Setting) => this.addConfigFilePathControl(setting),
			},
		];
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName(CONFIG_FILE_PATH_NAME)
			.setDesc(CONFIG_FILE_PATH_DESC)
			.then((setting) => this.addConfigFilePathControl(setting));
	}

	private addConfigFilePathControl(setting: Setting): void {
		setting.addText((text) =>
			text
				.setPlaceholder(DEFAULT_CONFIG_FILE_PATH)
				.setValue(this.plugin.settings.configFilePath)
				.onChange(async (value) => {
					this.plugin.settings.configFilePath = value;
					await this.plugin.saveSettings();
					this.plugin.reloadMappingsDebounced();
				}),
		);
	}
}
