import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { interfaces, devices, topologies } from '$lib/server/db/schema';
import { nanoid } from 'nanoid';
import { eq } from 'drizzle-orm';
import { notifyTopologyChanged } from '$lib/server/ws';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params, request }) => {
	const body = await request.json();
	const now = new Date().toISOString();
	const id = nanoid();

	db.insert(interfaces)
		.values({
			id,
			deviceId: params.id,
			name: body.name,
			comment: body.comment || null,
			sortOrder: body.sortOrder ?? 0,
			createdAt: now
		})
		.run();

	// Update topology timestamp
	const device = db.select().from(devices).where(eq(devices.id, params.id)).get();
	if (device) {
		db.update(topologies)
			.set({ updatedAt: now })
			.where(eq(topologies.id, device.topologyId))
			.run();
		notifyTopologyChanged(device.topologyId);
	}

	return json({ id }, { status: 201 });
};
