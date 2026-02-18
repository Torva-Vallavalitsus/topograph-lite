import { eq } from 'drizzle-orm';
import { db } from './db';
import { devices, interfaces } from './db/schema';
import type { TopologyDevice, TopologyInterface } from '$lib/types';

export function buildTree(topologyId: string): TopologyDevice[] {
	const allDevices = db.select().from(devices).where(eq(devices.topologyId, topologyId)).all();
	const deviceIds = allDevices.map((d) => d.id);
	// Get all interfaces for devices in this topology
	const deviceInterfaces = deviceIds.length
		? db
				.select()
				.from(interfaces)
				.all()
				.filter((iface) => deviceIds.includes(iface.deviceId))
		: [];

	// Build lookup maps
	const deviceMap = new Map<string, TopologyDevice>();
	for (const d of allDevices) {
		deviceMap.set(d.id, {
			...d,
			type: d.type as TopologyDevice['type'],
			interfaces: []
		});
	}

	// Attach interfaces to devices
	const interfaceMap = new Map<string, TopologyInterface>();
	for (const iface of deviceInterfaces) {
		const ifaceObj: TopologyInterface = {
			...iface,
			childDevice: undefined
		};
		interfaceMap.set(iface.id, ifaceObj);
		const device = deviceMap.get(iface.deviceId);
		if (device) {
			device.interfaces.push(ifaceObj);
		}
	}

	// Sort interfaces alphabetically (natural sort so Port2 < Port10)
	const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
	for (const device of deviceMap.values()) {
		device.interfaces.sort((a, b) => collator.compare(a.name, b.name));
	}

	// Attach child devices to interfaces
	for (const device of deviceMap.values()) {
		if (device.parentInterfaceId) {
			const parentIface = interfaceMap.get(device.parentInterfaceId);
			if (parentIface) {
				parentIface.childDevice = device;
			}
		}
	}

	// Root devices have no parent interface
	const roots = allDevices
		.filter((d) => !d.parentInterfaceId)
		.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
		.map((d) => deviceMap.get(d.id)!);

	return roots;
}
