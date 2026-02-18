import { db } from '$lib/server/db';
import { topologies } from '$lib/server/db/schema';
import { buildTree } from '$lib/server/topology';
import { eq } from 'drizzle-orm';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const topology = db
		.select()
		.from(topologies)
		.where(eq(topologies.id, params.id))
		.get();

	if (!topology) {
		error(404, 'Topology not found');
	}

	const tree = buildTree(params.id);

	return {
		topology,
		tree
	};
};
