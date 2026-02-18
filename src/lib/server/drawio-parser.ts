import { nanoid } from 'nanoid';

interface ParsedDevice {
	cellId: string;
	label: string;
	hostname: string | null;
	vendor: string | null;
	model: string | null;
	serialNumber: string | null;
	primaryMac: string | null;
	type: 'router' | 'switch' | 'access-point' | 'end-device' | 'server';
}

interface ParsedEdge {
	cellId: string;
	sourceId: string;
	targetId: string;
	sourceLabel: string | null;
	targetLabel: string | null;
	edgeValue: string | null;
}

interface ImportResult {
	devices: Array<{
		id: string;
		hostname: string | null;
		vendor: string | null;
		model: string | null;
		serialNumber: string | null;
		primaryMac: string | null;
		type: string;
		parentInterfaceId: string | null;
		uplinkInterfaceName: string | null;
	}>;
	interfaces: Array<{
		id: string;
		deviceId: string;
		name: string;
	}>;
}

function decodeXmlEntities(text: string): string {
	return text
		.replace(/&amp;/g, '&')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&quot;/g, '"')
		.replace(/&apos;/g, "'")
		.replace(/&nbsp;/g, ' ');
}

function stripHtml(html: string): string {
	// First decode XML/HTML entities so tags become actual tags
	const decoded = decodeXmlEntities(html);
	return decoded
		.replace(/<br\s*\/?>/gi, '\n')
		.replace(/<div>/gi, '\n')
		.replace(/<\/div>/gi, '')
		.replace(/<[^>]*>/g, '')
		.replace(/[^\S\n]+/g, ' ')  // collapse spaces but preserve newlines
		.trim();
}

function parseDeviceLabel(rawLabel: string): Omit<ParsedDevice, 'cellId'> {
	const text = stripHtml(rawLabel);
	const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

	let hostname: string | null = null;
	let vendor: string | null = null;
	let model: string | null = null;
	let serialNumber: string | null = null;
	let primaryMac: string | null = null;

	for (const line of lines) {
		const snMatch = line.match(/^SN[:\s]+(.+)/i);
		if (snMatch) {
			serialNumber = snMatch[1].trim();
			continue;
		}

		const macMatch = line.match(/^(?:MAC|Mac)[:\s]+(.+)/i);
		if (macMatch) {
			primaryMac = macMatch[1].trim();
			continue;
		}

		const hostnameMatch = line.match(/^Hostname\s*[-:]\s*(.+)/i);
		if (hostnameMatch) {
			hostname = hostnameMatch[1].trim();
			continue;
		}

		// First non-metadata line is the device name/model
		if (!model) {
			model = line;
		}
	}

	// Also check for inline SN: and MAC: in the model line
	if (model) {
		const inlineSn = model.match(/\bSN[:\s]+(\S+)/i);
		if (inlineSn && !serialNumber) {
			serialNumber = inlineSn[1];
		}
		const inlineMac = model.match(/\b(?:MAC|mac)[:\s]+(\S+)/i);
		if (inlineMac && !primaryMac) {
			primaryMac = inlineMac[1];
		}
	}

	// Try to extract vendor from model
	if (model) {
		const knownVendors = [
			'Cisco', 'Zyxel', 'Ruckus', 'TrendNet', 'TG-NET', '3Com',
			'Link sys', 'Linksys', 'Telia', 'MikroTik'
		];
		for (const v of knownVendors) {
			if (model.toLowerCase().includes(v.toLowerCase())) {
				vendor = v;
				break;
			}
		}
	}

	// Determine device type
	let type: ParsedDevice['type'] = 'switch';
	if (model) {
		const lower = model.toLowerCase();
		if (lower.includes('router') || lower.includes('asr') || lower.includes('891')) {
			type = 'router';
		} else if (lower.includes('ap') || lower.includes('access') || lower.includes('ruckus') || lower.includes('h550') || lower.includes('wifi')) {
			type = 'access-point';
		}
	}

	if (!hostname) {
		hostname = model;
	}

	return { label: rawLabel, hostname, vendor, model, serialNumber, primaryMac, type };
}

export function parseDrawioXml(xml: string): ImportResult {
	// Simple XML parsing without external deps
	const devices: ParsedDevice[] = [];
	const edges: ParsedEdge[] = [];
	const edgeLabels = new Map<string, Array<{ value: string; relativeX: number }>>();

	// Extract all mxCell elements
	const cellRegex = /<mxCell\s+([^>]*?)(?:\/>|>([\s\S]*?)<\/mxCell>)/g;
	let match;

	while ((match = cellRegex.exec(xml)) !== null) {
		const attrs = match[1];
		const inner = match[2] || '';

		const id = getAttr(attrs, 'id');
		const value = getAttr(attrs, 'value');
		const parent = getAttr(attrs, 'parent');
		const source = getAttr(attrs, 'source');
		const target = getAttr(attrs, 'target');
		const style = getAttr(attrs, 'style');
		const vertex = getAttr(attrs, 'vertex');
		const edge = getAttr(attrs, 'edge');
		const connectable = getAttr(attrs, 'connectable');

		if (vertex === '1' && connectable === '0' && parent) {
			// This is an edge label
			const geoMatch = inner.match(/<mxGeometry[^>]*>/);
			let relativeX = 0;
			if (geoMatch) {
				const rx = getAttr(geoMatch[0], 'x');
				if (rx) relativeX = parseFloat(rx);
			}
			if (!edgeLabels.has(parent)) {
				edgeLabels.set(parent, []);
			}
			edgeLabels.get(parent)!.push({ value: value || '', relativeX });
		} else if (edge === '1' && source && target) {
			edges.push({
				cellId: id || '',
				sourceId: source,
				targetId: target,
				sourceLabel: null,
				targetLabel: null,
				edgeValue: value || null
			});
		} else if (vertex === '1' && value && id && parent === '1') {
			const parsed = parseDeviceLabel(value);
			devices.push({ cellId: id, ...parsed });
		}
	}

	// Assign edge labels
	for (const edge of edges) {
		const labels = edgeLabels.get(edge.cellId) || [];
		for (const label of labels) {
			if (label.relativeX < 0) {
				edge.sourceLabel = label.value;
			} else {
				edge.targetLabel = label.value;
			}
		}
		// If the edge has a value attribute and no source label, use it as source label
		if (edge.edgeValue && !edge.sourceLabel) {
			edge.sourceLabel = edge.edgeValue;
		}
	}

	// Find root device (most outgoing edges, or device never seen as a target)
	const targetIds = new Set(edges.map((e) => e.targetId));
	const outgoingCount = new Map<string, number>();
	for (const e of edges) {
		outgoingCount.set(e.sourceId, (outgoingCount.get(e.sourceId) || 0) + 1);
	}

	let rootCellId: string | null = null;

	// First try: device that's never a target
	for (const d of devices) {
		if (!targetIds.has(d.cellId)) {
			if (!rootCellId || (outgoingCount.get(d.cellId) || 0) > (outgoingCount.get(rootCellId) || 0)) {
				rootCellId = d.cellId;
			}
		}
	}

	// If all devices are targets (cycle), pick the one with most outgoing edges
	if (!rootCellId) {
		let maxOut = -1;
		for (const d of devices) {
			const count = outgoingCount.get(d.cellId) || 0;
			if (count > maxOut) {
				maxOut = count;
				rootCellId = d.cellId;
			}
		}
	}

	// Build tree via BFS, ignoring back-edges
	const resultDevices: ImportResult['devices'] = [];
	const resultInterfaces: ImportResult['interfaces'] = [];
	const visited = new Set<string>();
	const cellToDeviceId = new Map<string, string>();

	// Create device IDs
	for (const d of devices) {
		cellToDeviceId.set(d.cellId, nanoid());
	}

	function processDevice(cellId: string, parentInterfaceId: string | null, uplinkInterfaceName: string | null) {
		if (visited.has(cellId)) return;
		visited.add(cellId);

		const device = devices.find((d) => d.cellId === cellId);
		if (!device) return;

		const deviceId = cellToDeviceId.get(cellId)!;
		resultDevices.push({
			id: deviceId,
			hostname: device.hostname,
			vendor: device.vendor,
			model: device.model,
			serialNumber: device.serialNumber,
			primaryMac: device.primaryMac,
			type: device.type,
			parentInterfaceId,
			uplinkInterfaceName
		});

		// Find outgoing edges
		const outEdges = edges.filter((e) => e.sourceId === cellId);
		for (const edge of outEdges) {
			if (visited.has(edge.targetId)) continue;

			// Create interface on source device for this connection
			const ifaceId = nanoid();
			const ifaceName = edge.sourceLabel || edge.edgeValue || `Port${resultInterfaces.length + 1}`;
			resultInterfaces.push({
				id: ifaceId,
				deviceId: deviceId,
				name: ifaceName
			});

			// Pass the target label as the child's uplink interface name
			processDevice(edge.targetId, ifaceId, edge.targetLabel || null);
		}

		// Also check incoming edges where this device is the target
		// but the source hasn't been visited (handles bi-directional references)
		const inEdges = edges.filter((e) => e.targetId === cellId && !visited.has(e.sourceId));
		for (const edge of inEdges) {
			const ifaceId = nanoid();
			const ifaceName = edge.targetLabel || `Port${resultInterfaces.length + 1}`;
			resultInterfaces.push({
				id: ifaceId,
				deviceId: deviceId,
				name: ifaceName
			});
			processDevice(edge.sourceId, ifaceId, edge.sourceLabel || null);
		}
	}

	if (rootCellId) {
		processDevice(rootCellId, null, null);
	}

	// Process any disconnected devices
	for (const d of devices) {
		if (!visited.has(d.cellId)) {
			processDevice(d.cellId, null, null);
		}
	}

	return { devices: resultDevices, interfaces: resultInterfaces };
}

function getAttr(tag: string, name: string): string | null {
	const regex = new RegExp(`${name}="([^"]*)"`, 'i');
	const match = tag.match(regex);
	return match ? match[1] : null;
}
