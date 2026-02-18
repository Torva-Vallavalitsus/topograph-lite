const EXPIRY_MS = 30_000;

interface LiveEdit {
	fields: Record<string, unknown>;
	timeout: ReturnType<typeof setTimeout>;
}

let edits = $state<Map<string, LiveEdit>>(new Map());

export function setLiveEdit(deviceId: string, fields: Record<string, unknown>) {
	const existing = edits.get(deviceId);
	if (existing) clearTimeout(existing.timeout);

	const timeout = setTimeout(() => {
		edits.delete(deviceId);
		edits = new Map(edits);
	}, EXPIRY_MS);

	edits.set(deviceId, { fields, timeout });
	edits = new Map(edits);
}

export function clearLiveEdit(deviceId: string) {
	const existing = edits.get(deviceId);
	if (existing) {
		clearTimeout(existing.timeout);
		edits.delete(deviceId);
		edits = new Map(edits);
	}
}

export function clearAllLiveEdits() {
	for (const entry of edits.values()) {
		clearTimeout(entry.timeout);
	}
	edits = new Map();
}

export function getLiveEdit(deviceId: string): Record<string, unknown> | undefined {
	return edits.get(deviceId)?.fields;
}
