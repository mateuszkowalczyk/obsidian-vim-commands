import { describe, expect, it } from 'vitest';
import {
	DEFAULT_LEADER_KEY,
	expandLeaderKeySequence,
	parseConfiguredLeaderKey,
	parseMapleaderLine,
	parseMappingLines,
	parseNmapObcommandLine,
	tokenizeKeySequence,
} from './parser';

describe('parseNmapObcommandLine', () => {
	it('parses obcommand mappings that use <space>', () => {
		expect(
			parseNmapObcommandLine(
				'nmap <Space><Space> :obcommand<space>switcher:open<CR>',
			),
		).toEqual({
			keys: '<Space><Space>',
			commandId: 'switcher:open',
		});
	});

	it('parses obcommand mappings that use whitespace', () => {
		expect(
			parseNmapObcommandLine(
				'nmap H :obcommand workspace:previous-tab<CR>',
			),
		).toEqual({
			keys: 'H',
			commandId: 'workspace:previous-tab',
		});
	});

	it('ignores unsupported mappings', () => {
		expect(parseNmapObcommandLine('nmap j gj')).toBeNull();
		expect(parseNmapObcommandLine('nnoremap j :obcommand test:run<CR>')).toBeNull();
		expect(parseNmapObcommandLine('imap j :obcommand test:run<CR>')).toBeNull();
		expect(parseNmapObcommandLine('set tabstop=4')).toBeNull();
	});

	it('requires vimrc command casing', () => {
		expect(
			parseNmapObcommandLine(
				'NMAP H :obcommand workspace:previous-tab<CR>',
			),
		).toBeNull();
		expect(
			parseNmapObcommandLine(
				'nmap H :Obcommand workspace:previous-tab<CR>',
			),
		).toBeNull();
		expect(
			parseNmapObcommandLine(
				'nmap H :obcommand workspace:previous-tab<cr>',
			),
		).toBeNull();
	});
});

describe('parseMapleaderLine', () => {
	it('parses supported mapleader assignments', () => {
		expect(parseMapleaderLine('let mapleader = " "')).toBe(
			DEFAULT_LEADER_KEY,
		);
		expect(parseMapleaderLine('let mapleader = ","')).toBe(',');
		expect(parseMapleaderLine('let mapleader = "\\<Space>"')).toBe(
			DEFAULT_LEADER_KEY,
		);
		expect(parseMapleaderLine('let mapleader = "\\<C-b>"')).toBe(
			'<C-b>',
		);
		expect(parseMapleaderLine('let mapleader = "\\\\"')).toBe('\\');
	});

	it('ignores unsupported mapleader lines', () => {
		expect(parseMapleaderLine('let maplocalleader = ","')).toBeNull();
		expect(parseMapleaderLine('set tabstop=4')).toBeNull();
		expect(parseMapleaderLine('Let mapleader = ","')).toBeNull();
	});
});

describe('parseConfiguredLeaderKey', () => {
	it('defaults to space when no mapleader is configured', () => {
		expect(parseConfiguredLeaderKey(['nmap H :obcommand workspace:previous-tab<CR>'])).toBe(
			DEFAULT_LEADER_KEY,
		);
	});

	it('uses the last supported mapleader assignment', () => {
		expect(
			parseConfiguredLeaderKey([
				'let mapleader = " "',
				'let mapleader = ","',
			]),
		).toBe(',');
	});
});

describe('expandLeaderKeySequence', () => {
	it('expands exact <Leader> tokens', () => {
		expect(expandLeaderKeySequence('<Leader>gg', ',')).toBe(',gg');
		expect(expandLeaderKeySequence('<leader>gg', ',')).toBe(',gg');
		expect(expandLeaderKeySequence('<Leader><Leader>', DEFAULT_LEADER_KEY)).toBe(
			'<Space><Space>',
		);
	});
});

describe('tokenizeKeySequence', () => {
	it('splits Vim-style key sequences into canonical tokens', () => {
		expect(tokenizeKeySequence('<Space><Space>')).toEqual([
			'<Space>',
			'<Space>',
		]);
		expect(tokenizeKeySequence('<C-o>')).toEqual(['<C-o>']);
		expect(tokenizeKeySequence('<A-p>')).toEqual(['<A-p>']);
		expect(tokenizeKeySequence('<space><cr><C-O><C-Space>')).toEqual([
			'<Space>',
			'<CR>',
			'<C-o>',
			'<C-Space>',
		]);
		expect(tokenizeKeySequence('<C-Enter><A-Left>')).toEqual([
			'<C-CR>',
			'<A-Left>',
		]);
		expect(tokenizeKeySequence('<A-ArrowLeft>')).toEqual(['<A-ArrowLeft>']);
		expect(tokenizeKeySequence('<S-h><S-Left><S-A-b><C-S-O>')).toEqual([
			'H',
			'<S-Left>',
			'<A-S-b>',
			'<C-S-o>',
		]);
		expect(tokenizeKeySequence('H/:|-')).toEqual(['H', '/', ':', '|', '-']);
	});
});

describe('parseMappingLines', () => {
	it('parses command mappings with configured leader expansion', () => {
		expect(
			parseMappingLines([
				'let mapleader = ","',
				'nmap <Leader>gg :obcommand<space>obsidian-git:open-git-view<CR>',
				'nmap j gj',
			]),
		).toEqual([
			{
				keys: [',', 'g', 'g'],
				commandId: 'obsidian-git:open-git-view',
				requiresDomFallback: true,
			},
		]);
	});

	it('expands Vim-style escaped special-key leaders', () => {
		expect(
			parseMappingLines([
				'let mapleader = "\\<C-b>"',
				'nmap <Leader>g :obcommand<space>global-search:open<CR>',
			]),
		).toEqual([
			{
				keys: ['<C-b>', 'g'],
				commandId: 'global-search:open',
				requiresDomFallback: true,
			},
		]);
	});

	it('expands an escaped backslash leader', () => {
		expect(
			parseMappingLines([
				'let mapleader = "\\\\"',
				'nmap <Leader>g :obcommand<space>global-search:open<CR>',
			]),
		).toEqual([
			{
				keys: ['\\', 'g'],
				commandId: 'global-search:open',
				requiresDomFallback: true,
			},
		]);
	});

	it('routes direct Space mappings through the DOM fallback', () => {
		expect(
			parseMappingLines([
				'nmap <Space>/ :obcommand<space>global-search:open<CR>',
				'nmap <A-p> :obcommand<space>command-palette:open<CR>',
			]),
		).toEqual([
			{
				keys: ['<Space>', '/'],
				commandId: 'global-search:open',
				requiresDomFallback: true,
			},
			{
				keys: ['<A-p>'],
				commandId: 'command-palette:open',
				requiresDomFallback: false,
			},
		]);
	});

	it('canonicalizes lowercase leader and mixed-case key notation', () => {
		expect(
			parseMappingLines([
				'nmap <leader><C-O> :obcommand<space>command-palette:open<CR>',
			]),
		).toEqual([
			{
				keys: ['<Space>', '<C-o>'],
				commandId: 'command-palette:open',
				requiresDomFallback: true,
			},
		]);
	});

	it('uses the last declaration when mappings have the same keys', () => {
		expect(
			parseMappingLines([
				'nmap gd :obcommand<space>editor:first<CR>',
				'nmap H :obcommand<space>workspace:previous-tab<CR>',
				'nmap gd :obcommand<space>editor:last<CR>',
			]),
		).toEqual([
			{
				keys: ['H'],
				commandId: 'workspace:previous-tab',
				requiresDomFallback: false,
			},
			{
				keys: ['g', 'd'],
				commandId: 'editor:last',
				requiresDomFallback: false,
			},
		]);
	});

	it('deduplicates mappings after leader expansion and canonicalization', () => {
		expect(
			parseMappingLines([
				'let mapleader = ","',
				'nmap <Leader><C-O> :obcommand<space>command:first<CR>',
				'nmap ,<C-o> :obcommand<space>command:last<CR>',
			]),
		).toEqual([
			{
				keys: [',', '<C-o>'],
				commandId: 'command:last',
				requiresDomFallback: false,
			},
		]);
	});

	it('reports malformed plugin mappings with their line number', () => {
		expect(() =>
			parseMappingLines([
				'set tabstop=4',
				'nmap H :obcommand workspace:previous-tab<cr>',
			]),
		).toThrow('Invalid Vim command mapping on line 2.');
	});

	it('reports malformed mapleader assignments with their line number', () => {
		expect(() =>
			parseMappingLines([
				'" Vim commands',
				'let mapleader = ","',
				"let mapleader = ','",
			]),
		).toThrow('Invalid mapleader assignment on line 3.');
	});

	it('continues to ignore unrelated Vim mappings', () => {
		expect(parseMappingLines(['nmap j gj', 'set tabstop=4'])).toEqual([]);
	});
});
