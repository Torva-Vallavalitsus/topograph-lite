import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { topologies, devices, interfaces } from '$lib/server/db/schema';
import { parseDrawioXml } from '$lib/server/drawio-parser';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();
	const { xml, name } = body;

	const now = new Date().toISOString();
	const topologyId = nanoid();

	// Create topology
	db.insert(topologies)
		.values({ id: topologyId, name, createdAt: now, updatedAt: now })
		.run();

	// Parse draw.io XML
	const result = parseDrawioXml(xml);

	// Insert devices first without parent references (to avoid FK issues)
	for (const device of result.devices) {
		db.insert(devices)
			.values({
				id: device.id,
				topologyId,
				parentInterfaceId: null,
				hostname: device.hostname,
				vendor: device.vendor,
				model: device.model,
				serialNumber: device.serialNumber,
				primaryMac: device.primaryMac,
				type: device.type,
				createdAt: now,
				updatedAt: now
			})
			.run();
	}

	// Insert interfaces
	for (const iface of result.interfaces) {
		db.insert(interfaces)
			.values({
				id: iface.id,
				deviceId: iface.deviceId,
				name: iface.name,
				createdAt: now
			})
			.run();
	}

	// Now set parent interface references and uplink interface names
	for (const device of result.devices) {
		if (device.parentInterfaceId || device.uplinkInterfaceName) {
			db.update(devices)
				.set({
					parentInterfaceId: device.parentInterfaceId,
					uplinkInterfaceName: device.uplinkInterfaceName
				})
				.where(eq(devices.id, device.id))
				.run();
		}
	}

	return json({ id: topologyId }, { status: 201 });
};
