import { json } from '@sveltejs/kit';
import { buildTree } from '$lib/server/topology';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
	const tree = buildTree(params.id);
	return json(tree);
};
