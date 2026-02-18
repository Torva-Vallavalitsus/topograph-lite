import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { interfaces, devices } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { notifyTopologyChanged } from '$lib/server/ws';
import type { RequestHandler } from './$types';

export const PATCH: RequestHandler = async ({ params, request }) => {
	const body = await request.json();

	const updateData: Record<string, unknown> = {};
	if ('name' in body) updateData.name = body.name;
	if ('comment' in body) updateData.comment = body.comment;
	if ('sortOrder' in body) updateData.sortOrder = body.sortOrder;

	db.update(interfaces)
		.set(updateData)
		.where(eq(interfaces.id, params.id))
		.run();

	const iface = db.select().from(interfaces).where(eq(interfaces.id, params.id)).get();
	if (iface) {
		const device = db.select().from(devices).where(eq(devices.id, iface.deviceId)).get();
		if (device) notifyTopologyChanged(device.topologyId);
	}

	return json({ success: true });
};

export const DELETE: RequestHandler = async ({ params }) => {
	const iface = db.select().from(interfaces).where(eq(interfaces.id, params.id)).get();

	// Disconnect child devices before deleting
	db.update(devices)
		.set({ parentInterfaceId: null })
		.where(eq(devices.parentInterfaceId, params.id))
		.run();

	db.delete(interfaces).where(eq(interfaces.id, params.id)).run();

	if (iface) {
		const device = db.select().from(devices).where(eq(devices.id, iface.deviceId)).get();
		if (device) notifyTopologyChanged(device.topologyId);
	}

	return json({ success: true });
};
