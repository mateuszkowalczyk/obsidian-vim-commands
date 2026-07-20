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
const README_URL =
	'https://github.com/mateuszkowalczyk/obsidian-vim-commands/blob/master/README.md';
const EXAMPLE_CONFIG_URL =
	'https://github.com/mateuszkowalczyk/obsidian-vim-commands/blob/master/examples/lazy.vimrc';

function createConfigFilePathDescription(): DocumentFragment {
	const description = createFragment();
	description.append('Path to the vimrc-style command mapping file in this vault. See the ');
	description.createEl('a', {
		text: 'README',
		href: README_URL,
		attr: { target: '_blank', rel: 'noopener noreferrer' },
	});
	description.append(' for setup and syntax, or start with the ');
	description.createEl('a', {
		text: 'Example config',
		href: EXAMPLE_CONFIG_URL,
		attr: { target: '_blank', rel: 'noopener noreferrer' },
	});
	description.append('.');

	return description;
}

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
				desc: createConfigFilePathDescription(),
				render: (setting) => this.addConfigFilePathControl(setting),
			},
		];
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName(CONFIG_FILE_PATH_NAME)
			.setDesc(createConfigFilePathDescription())
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
