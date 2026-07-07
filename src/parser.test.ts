import { describe, expect, it } from 'vitest';
import {
	DEFAULT_LEADER_KEY,
	expandLeaderKeySequence,
	parseConfiguredLeaderKey,
	parseMapleaderLine,
	parseMappingLines,
	parseNmapObcommandLine,
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
		expect(expandLeaderKeySequence('<Leader><Leader>', DEFAULT_LEADER_KEY)).toBe(
			'<Space><Space>',
		);
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
				keys: ',gg',
				commandId: 'obsidian-git:open-git-view',
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
				keys: '<C-b>g',
				commandId: 'global-search:open',
			},
		]);
	});
});
