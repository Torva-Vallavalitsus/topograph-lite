import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { devices, interfaces, topologies } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const PATCH: RequestHandler = async ({ params, request }) => {
	const body = await request.json();
	const now = new Date().toISOString();

	const updateData: Record<string, unknown> = { updatedAt: now };
	const fields = [
		'hostname', 'ip', 'vendor', 'model', 'serialNumber',
		'firmwareVersion', 'primaryMac', 'type', 'uplinkInterfaceName', 'assetTag', 'comment', 'location', 'sortOrder',
		'parentInterfaceId'
	];
	for (const field of fields) {
		if (field in body) {
			updateData[field] = body[field];
		}
	}

	db.update(devices)
		.set(updateData)
		.where(eq(devices.id, params.id))
		.run();

	// Update topology timestamp
	const device = db.select().from(devices).where(eq(devices.id, params.id)).get();
	if (device) {
		db.update(topologies)
			.set({ updatedAt: now })
			.where(eq(topologies.id, device.topologyId))
			.run();
	}

	return json({ success: true });
};

export const DELETE: RequestHandler = async ({ params }) => {
	// Recursively delete device and all children
	deleteDeviceRecursive(params.id);
	return json({ success: true });
};

function deleteDeviceRecursive(deviceId: string) {
	// Find all interfaces of this device
	const deviceInterfaces = db
		.select()
		.from(interfaces)
		.where(eq(interfaces.deviceId, deviceId))
		.all();

	// For each interface, find and delete child devices
	for (const iface of deviceInterfaces) {
		const childDevices = db
			.select()
			.from(devices)
			.where(eq(devices.parentInterfaceId, iface.id))
			.all();
		for (const child of childDevices) {
			deleteDeviceRecursive(child.id);
		}
	}

	// Delete the device (cascade will handle its interfaces)
	db.delete(devices).where(eq(devices.id, deviceId)).run();
}
