export interface CommandMapping {
	keys: string[];
	commandId: string;
}

export interface ParsedNmapObcommandLine {
	keys: string;
	commandId: string;
}

export const DEFAULT_LEADER_KEY = '<Space>';

export function parseNmapObcommandLine(
	line: string,
): ParsedNmapObcommandLine | null {
	const match = line.match(
		/^nmap\s+(\S+)\s+:obcommand(?:<space>|\s+)(\S+)<CR>\s*$/,
	);

	if (!match) {
		return null;
	}

	const [, keys, commandId] = match;

	if (!keys || !commandId) {
		return null;
	}

	return { keys, commandId };
}

export function parseMapleaderLine(line: string): string | null {
	const match = line.match(/^let\s+mapleader\s*=\s*"([^"]+)"\s*$/);

	if (!match) {
		return null;
	}

	const [, leaderKey] = match;

	if (!leaderKey) {
		return null;
	}

	return normalizeLeaderKey(leaderKey);
}

export function parseConfiguredLeaderKey(lines: string[]): string {
	let leaderKey = DEFAULT_LEADER_KEY;

	for (const line of lines) {
		const parsedLeaderKey = parseMapleaderLine(line);

		if (parsedLeaderKey !== null) {
			leaderKey = parsedLeaderKey;
		}
	}

	return leaderKey;
}

export function expandLeaderKeySequence(
	keys: string,
	leaderKey: string,
): string {
	return keys.replace(/<Leader>/g, leaderKey);
}

export function parseMappingLines(
	lines: string[],
): CommandMapping[] {
	const leaderKey = parseConfiguredLeaderKey(lines);

	return lines.flatMap((line) => {
		const mapping = parseNmapObcommandLine(line);

		if (mapping === null) {
			return [];
		}

		return [
			{
				...mapping,
				keys: tokenizeKeySequence(
					expandLeaderKeySequence(mapping.keys, leaderKey),
				),
			},
		];
	});
}

export function tokenizeKeySequence(keys: string): string[] {
	const tokens: string[] = [];
	let index = 0;

	while (index < keys.length) {
		const key = keys[index];

		if (!key) {
			break;
		}

		if (key === '<') {
			const tokenEndIndex = keys.indexOf('>', index + 1);

			if (tokenEndIndex !== -1) {
				tokens.push(keys.slice(index, tokenEndIndex + 1));
				index = tokenEndIndex + 1;
				continue;
			}
		}

		tokens.push(key);
		index += 1;
	}

	return tokens;
}

function normalizeLeaderKey(leaderKey: string): string {
	const specialKeyMatch = leaderKey.match(/^\\(<[^>]+>)$/);

	if (specialKeyMatch?.[1]) {
		return specialKeyMatch[1];
	}

	return leaderKey === ' ' ? DEFAULT_LEADER_KEY : leaderKey;
}
