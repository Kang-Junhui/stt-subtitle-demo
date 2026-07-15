import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { submitTranscription } from '$lib/server/rtzr';

export const POST: RequestHandler = async ({ request }) => {
	const form = await request.formData();
	const file = form.get('file');

	if (!(file instanceof File) || file.size === 0) {
		error(400, '업로드된 파일이 없습니다.');
	}

	if (!file.type.includes('mp4') && !file.name.toLowerCase().endsWith('.mp4')) {
		error(400, 'mp4 파일만 업로드할 수 있습니다.');
	}

	const id = await submitTranscription(file, {
		model_name: 'sommers',
		language: 'ko',
		use_diarization: true,
		diarization: { spk_count: 0 },
		use_disfluency_filter: true,
		use_word_timestamp: true
	});

	return json({ id });
};
