import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { devices, topologies } from '$lib/server/db/schema';
import { nanoid } from 'nanoid';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params, request }) => {
	const body = await request.json();
	const now = new Date().toISOString();
	const id = nanoid();

	db.insert(devices)
		.values({
			id,
			topologyId: params.id,
			parentInterfaceId: body.parentInterfaceId || null,
			hostname: body.hostname || null,
			ip: body.ip || null,
			vendor: body.vendor || null,
			model: body.model || null,
			serialNumber: body.serialNumber || null,
			firmwareVersion: body.firmwareVersion || null,
			primaryMac: body.primaryMac || null,
			type: body.type || 'switch',
			uplinkInterfaceName: body.uplinkInterfaceName || null,
			comment: body.comment || null,
			location: body.location || null,
			sortOrder: body.sortOrder ?? 0,
			createdAt: now,
			updatedAt: now
		})
		.run();

	// Update topology timestamp
	db.update(topologies)
		.set({ updatedAt: now })
		.where(eq(topologies.id, params.id))
		.run();

	return json({ id }, { status: 201 });
};
