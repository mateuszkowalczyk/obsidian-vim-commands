import { App, PluginSettingTab, Setting, SettingGroup } from 'obsidian';
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

// Obsidian 1.13 formalized this render definition in its public types. Keep a
// structural declaration and display() fallback while supporting Obsidian 1.12.
export interface SettingDefinitionItem {
	name: string;
	desc?: string | DocumentFragment;
	render: (setting: Setting, group: SettingGroup) => void | (() => void);
}

export class VimCommandsSettingTab extends PluginSettingTab {
	plugin: VimCommandsPlugin;

	constructor(app: App, plugin: VimCommandsPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	getSettingDefinitions(): SettingDefinitionItem[] {
		return [
			{
				name: CONFIG_FILE_PATH_NAME,
				desc: CONFIG_FILE_PATH_DESC,
				render: (setting) => this.addConfigFilePathControl(setting),
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
					const previousValue = this.plugin.settings.configFilePath;
					this.plugin.settings.configFilePath = value;

					if (!(await this.plugin.saveSettings())) {
						this.plugin.settings.configFilePath = previousValue;
						text.setValue(previousValue);
						return;
					}

					this.plugin.reloadMappingsDebounced();
				}),
		);
	}
}
