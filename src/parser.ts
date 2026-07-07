export interface ParsedNmapObcommandLine {
	keys: string;
	commandId: string;
}

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
