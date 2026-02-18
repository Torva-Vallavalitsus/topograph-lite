import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { topologies } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const PATCH: RequestHandler = async ({ params, request }) => {
	const { name } = await request.json();
	const now = new Date().toISOString();

	db.update(topologies)
		.set({ name, updatedAt: now })
		.where(eq(topologies.id, params.id))
		.run();

	return json({ success: true });
};

export const DELETE: RequestHandler = async ({ params }) => {
	db.delete(topologies).where(eq(topologies.id, params.id)).run();
	return json({ success: true });
};
