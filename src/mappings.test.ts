import { describe, expect, it } from 'vitest';
import { parseNmapObcommandLine } from './parser';

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
