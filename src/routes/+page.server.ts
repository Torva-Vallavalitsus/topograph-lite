import { db } from '$lib/server/db';
import { topologies, devices } from '$lib/server/db/schema';
import { eq, count } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const allTopologies = db.select().from(topologies).all();

	const rows = allTopologies.map((t) => {
		const deviceCount = db
			.select({ count: count() })
			.from(devices)
			.where(eq(devices.topologyId, t.id))
			.get();
		return {
			...t,
			deviceCount: deviceCount?.count ?? 0
		};
	});

	return { topologies: rows };
};
