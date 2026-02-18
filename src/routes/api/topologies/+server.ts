import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { topologies, devices } from '$lib/server/db/schema';
import { nanoid } from 'nanoid';
import { eq, count } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	const allTopologies = db.select().from(topologies).all();
	const rows = allTopologies.map((t) => {
		const deviceCount = db
			.select({ count: count() })
			.from(devices)
			.where(eq(devices.topologyId, t.id))
			.get();
		return { ...t, deviceCount: deviceCount?.count ?? 0 };
	});

	return json(rows);
};

export const POST: RequestHandler = async ({ request }) => {
	const { name } = await request.json();
	const now = new Date().toISOString();
	const id = nanoid();

	db.insert(topologies)
		.values({ id, name, createdAt: now, updatedAt: now })
		.run();

	// Create a root device
	const rootId = nanoid();
	db.insert(devices)
		.values({
			id: rootId,
			topologyId: id,
			hostname: name,
			type: 'router',
			createdAt: now,
			updatedAt: now
		})
		.run();

	return json({ id, name }, { status: 201 });
};
