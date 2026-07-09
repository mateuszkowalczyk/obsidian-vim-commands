import { App } from 'obsidian';
import { describe, expect, it, vi } from 'vitest';
import { executeObsidianCommand } from './obsidianCommands';

describe('executeObsidianCommand', () => {
	it('executes an existing Obsidian command', () => {
		const executeCommandById = vi.fn();
		const app = appWithCommands({
			commands: {
				'global-search:open': {},
			},
			executeCommandById,
		});

		expect(executeObsidianCommand(app, 'global-search:open')).toBe(true);
		expect(executeCommandById).toHaveBeenCalledWith('global-search:open');
	});

	it('skips missing command IDs', () => {
		const executeCommandById = vi.fn();
		const app = appWithCommands({
			commands: {},
			executeCommandById,
		});

		expect(executeObsidianCommand(app, 'missing:command')).toBe(false);
		expect(executeCommandById).not.toHaveBeenCalled();
	});

	it('skips when the command manager is unavailable', () => {
		expect(executeObsidianCommand({} as App, 'global-search:open')).toBe(false);
	});
});

function appWithCommands(commands: unknown): App {
	return { commands } as unknown as App;
}
