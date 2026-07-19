" LazyVim-inspired starter config for the Vim Commands plugin. Copy
" this file to <vault>/.vimrc, trim to taste, and reload the plugin.
"
" Default <Leader> is <Space>, matching LazyVim. To override, uncomment:
" let mapleader = ","
"
" Before using this config, unassign the following default Obsidian
" hotkeys under Settings -> Hotkeys (they conflict with the Navigation
" mappings below):
"   Ctrl/Cmd+O  quick switcher / open file   <-> <C-o>
"   Ctrl/Cmd+I  italic                       <-> <C-i>
"   Ctrl/Cmd+H  find and replace             <-> <C-h>
"   Ctrl/Cmd+K  insert/edit link             <-> <C-k>
"
" Quick reference (most-used keys):
"   <Leader><Space>  quick switcher (find files)
"   <Leader>:        command palette
"   <Leader>/        global search
"   <Leader>e        file explorer
"   <Leader>fn       new note
"   <Leader>ot       insert template
"   <S-h> / <S-l>    previous / next tab
"   <Leader>bd       close current tab
"   <Leader>ol / <Leader>or  toggle left / right sidebar
"   gd               follow link under cursor

" Leader
" let mapleader = ","

" Navigation
nmap <C-o> :obcommand<space>app:go-back<CR>
nmap <C-i> :obcommand<space>app:go-forward<CR>
nmap <C-h> :obcommand<space>editor:focus-left<CR>
nmap <C-j> :obcommand<space>editor:focus-bottom<CR>
nmap <C-k> :obcommand<space>editor:focus-top<CR>
nmap <C-l> :obcommand<space>editor:focus-right<CR>

" Buffers (tabs)
nmap <S-h> :obcommand<space>workspace:previous-tab<CR>
nmap <S-l> :obcommand<space>workspace:next-tab<CR>
nmap <Leader>bn :obcommand<space>workspace:new-tab<CR>
nmap <Leader>bd :obcommand<space>workspace:close<CR>
nmap <Leader>bp :obcommand<space>workspace:toggle-pin<CR>
nmap <Leader>bo :obcommand<space>workspace:close-others-tab-group<CR>

" Splits
nmap <Leader>| :obcommand<space>workspace:split-vertical<CR>
nmap <Leader>- :obcommand<space>workspace:split-horizontal<CR>

" Files
nmap <Leader><Space> :obcommand<space>switcher:open<CR>
nmap <Leader>e :obcommand<space>file-explorer:open<CR>
nmap <Leader>fe :obcommand<space>file-explorer:open<CR>
nmap <Leader>fn :obcommand<space>file-explorer:new-file<CR>
nmap <Leader>fN :obcommand<space>file-explorer:new-file-in-new-pane<CR>
nmap <Leader>fr :obcommand<space>file-explorer:reveal-active-file<CR>
nmap <Leader>fD :obcommand<space>app:delete-file<CR>
nmap <Leader>cR :obcommand<space>workspace:edit-file-title<CR>

" Links
nmap gd :obcommand<space>editor:follow-link<CR>
nmap gr :obcommand<space>backlink:open<CR>
nmap gO :obcommand<space>outline:open<CR>

" Search
nmap <Leader>/ :obcommand<space>global-search:open<CR>
nmap <Leader>: :obcommand<space>command-palette:open<CR>
nmap <Leader>sr :obcommand<space>editor:open-search-replace<CR>

" Obsidian-specific notes
nmap <Leader>od :obcommand<space>daily-notes<CR>
nmap <Leader>ot :obcommand<space>insert-template<CR>
nmap <Leader>oy :obcommand<space>workspace:copy-path<CR>

" Obsidian-specific view toggles
nmap <Leader>os :obcommand<space>editor:toggle-source<CR>
nmap <Leader>ol :obcommand<space>app:toggle-left-sidebar<CR>
nmap <Leader>or :obcommand<space>app:toggle-right-sidebar<CR>

" Obsidian-specific navigation
nmap <Leader>ob :obcommand<space>backlink:open<CR>
nmap <Leader>og :obcommand<space>graph:open-local<CR>
nmap <Leader>oG :obcommand<space>graph:open<CR>
nmap <Leader>oB :obcommand<space>bookmarks:open<CR>
nmap <Leader>om :obcommand<space>bookmarks:bookmark-current-view<CR>
nmap <Leader>oO :obcommand<space>outline:open<CR>

" Obsidian-specific list toggles
nmap <Leader>ox :obcommand<space>editor:toggle-checklist-status<CR>
nmap <Leader>ou :obcommand<space>editor:toggle-bullet-list<CR>
nmap <Leader>oo :obcommand<space>editor:toggle-numbered-list<CR>

" Git (requires obsidian-git community plugin)
nmap <Leader>gg :obcommand<space>obsidian-git:open-git-view<CR>
nmap <Leader>gC :obcommand<space>obsidian-git:push<CR>
nmap <Leader>gf :obcommand<space>obsidian-git:open-history-view<CR>
nmap <Leader>gd :obcommand<space>obsidian-git:open-diff-view<CR>
nmap <Leader>gP :obcommand<space>obsidian-git:push2<CR>
nmap <Leader>gp :obcommand<space>obsidian-git:pull<CR>
