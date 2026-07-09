import { App } from 'obsidian';

interface ObsidianCommandManager {
	commands: Record<string, unknown>;
	executeCommandById(commandId: string): unknown;
}

export function executeObsidianCommand(app: App, commandId: string): boolean {
	const commandManager = (app as unknown as { commands?: unknown }).commands;

	if (!isCommandManager(commandManager) || !(commandId in commandManager.commands)) {
		return false;
	}

	commandManager.executeCommandById(commandId);
	return true;
}

function isCommandManager(value: unknown): value is ObsidianCommandManager {
	if (!value || typeof value !== 'object') {
		return false;
	}

	const candidate = value as Partial<ObsidianCommandManager>;

	return (
		Boolean(candidate.commands) &&
		typeof candidate.commands === 'object' &&
		typeof candidate.executeCommandById === 'function'
	);
}
