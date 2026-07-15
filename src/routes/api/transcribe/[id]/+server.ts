import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getTranscriptionResult } from '$lib/server/rtzr';

export const GET: RequestHandler = async ({ params }) => {
	const result = await getTranscriptionResult(params.id);
	return json(result);
};
