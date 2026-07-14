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

// Local structural type for the render variant of `SettingDefinitionItem`
// introduced in Obsidian 1.13. Declared here so the code compiles against the
// declared minimum app version (1.12) while staying type-safe once the
// `obsidian` dev dependency is upgraded.
//
// Migration to Obsidian 1.13 (perform in this order):
//   1. In `package.json`, bump the `obsidian` dev dependency to `^1.13.0`
//      and run `npm install` so the new type definitions are picked up.
//   2. In `manifest.json`, raise `minAppVersion` to `1.13.0`.
//   3. In `src/settings.ts`, delete this local `SettingDefinitionItem`
//      interface and import it from `obsidian` instead:
//          import { ..., SettingDefinitionItem } from 'obsidian';
//      Also drop `SettingGroup` from the import above — only Obsidian
//      supplies it. The return type of `getSettingDefinitions()` and the
//      shape of the returned objects do not need to change: a render
//      variant is structurally a member of the 1.13 `SettingDefinitionItem`
//      union, so the existing object literal stays valid.
//   4. Optional: prefer the declarative `SettingDefinitionControl` variant
//      (a `{ name, desc, control: { type: 'text', ... }, getValue, setValue }`
//      object) over the imperative `render` callback for a more idiomatic
//      1.13 settings tab. The current render implementation is still
//      supported.
//   5. `display()` can be removed once `minAppVersion` is 1.13+: Obsidian
//      1.13 stops calling it whenever `getSettingDefinitions()` returns a
//      non-empty array (and deprecates it entirely).
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
