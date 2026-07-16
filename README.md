# Vim Commands

Bring Vim-style command mappings to all of Obsidian:

- Map multi-key sequences, leaders, and modified keys to any Obsidian command.
- Use mappings across tabs, sidebars, search, and other app views, not only the editor.
- Keep mappings in a vault-local, vimrc-style config file.

Vim Commands works with core commands and commands added by community plugins (everything you can find in command palette).

It stays out of text fields and Vim insert mode.

This plugin extends Obsidian's built-in Vim mode; it does not replace it. Enable Obsidian's Vim key bindings to get standard Vim editing and use these command mappings inside the Markdown editor.

## Usage

1. Enable **Settings → Editor → Vim key bindings**.
2. Install and enable **Vim Commands**.
3. Create `.vimrc` in the root of your vault.
4. Add mappings using this form ([[#Config examples|examples below]]):

```vim
nmap <keys> :obcommand <command-id><CR>
```

5. Reload the plugin after editing the file.

Change the file path under **Settings → Vim Commands → Config file path** if you keep these mappings elsewhere. The path must be inside the vault.

Only `nmap ... :obcommand ...<CR>` and `let mapleader = "..."` are handled; unrelated vimrc lines are ignored. The default `<Leader>` key is `<Space>`.

If a key combination conflicts with an Obsidian hotkey, unassign that hotkey under **Settings → Hotkeys** first.

To inspect available command IDs, open the developer console and run:

```js
Object.entries(app.commands.commands).map(([id, command]) => [id, command.name]);
```

## Mini Vimrc

[Mini Vimrc](https://github.com/cabra-arretado/mini-vimrc-obsidian) complements this plugin well: Mini Vimrc configures editor behavior such as `inoremap jk <Esc>` and motion remaps, while Vim Commands invokes Obsidian commands throughout the app.

## Config examples

```vim
let mapleader = ","

" Open the command palette and search
nmap <Leader>: :obcommand command-palette:open<CR>
nmap <Leader>/ :obcommand global-search:open<CR>

" Open the quick switcher
nmap <Leader><Space> :obcommand switcher:open<CR>

" Move between tabs
nmap H :obcommand workspace:previous-tab<CR>
nmap L :obcommand workspace:next-tab<CR>

" Commands from community plugins work too
nmap <Leader>gg :obcommand obsidian-git:open-git-view<CR>
```

## License

[MIT](./LICENSE) © 2026 Mateusz Kowalczyk
