import { RTZR_CLIENT_ID, RTZR_CLIENT_SECRET } from '$env/static/private';
import type { SttUtterance } from '$lib/srt';

const BASE_URL = 'https://openapi.vito.ai';

export interface TranscribeConfig {
	model_name?: 'sommers' | 'whisper';
	language?: string;
	use_diarization?: boolean;
	diarization?: { spk_count?: number };
	use_itn?: boolean;
	use_disfluency_filter?: boolean;
	use_profanity_filter?: boolean;
	use_paragraph_splitter?: boolean;
	domain?: 'GENERAL' | 'CALL';
	use_word_timestamp?: boolean;
	keywords?: string[];
}

export interface TranscriptionResult {
	id: string;
	status: 'transcribing' | 'completed' | 'failed';
	results?: { utterances: SttUtterance[] };
	error?: { code: string; message: string };
}

let cachedToken: { accessToken: string; expireAt: number } | null = null;

async function getAccessToken(): Promise<string> {
	if (cachedToken && cachedToken.expireAt > Date.now() / 1000 + 60) {
		return cachedToken.accessToken;
	}

	const resp = await fetch(`${BASE_URL}/v1/authenticate`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: new URLSearchParams({
			client_id: RTZR_CLIENT_ID,
			client_secret: RTZR_CLIENT_SECRET
		})
	});

	if (!resp.ok) {
		throw new Error(`RTZR 인증 실패 (${resp.status}): ${await resp.text()}`);
	}

	const data = (await resp.json()) as { access_token: string; expire_at: number };
	cachedToken = { accessToken: data.access_token, expireAt: data.expire_at };
	return cachedToken.accessToken;
}

export async function submitTranscription(file: File, config: TranscribeConfig): Promise<string> {
	const token = await getAccessToken();

	const form = new FormData();
	form.append('config', JSON.stringify(config));
	form.append('file', file);

	const resp = await fetch(`${BASE_URL}/v1/transcribe`, {
		method: 'POST',
		headers: { Authorization: `Bearer ${token}` },
		body: form
	});

	if (!resp.ok) {
		throw new Error(`전사 요청 실패 (${resp.status}): ${await resp.text()}`);
	}

	const data = (await resp.json()) as { id: string };
	return data.id;
}

export async function getTranscriptionResult(id: string): Promise<TranscriptionResult> {
	const token = await getAccessToken();

	const resp = await fetch(`${BASE_URL}/v1/transcribe/${id}`, {
		headers: { Authorization: `Bearer ${token}` }
	});

	if (!resp.ok) {
		throw new Error(`전사 결과 조회 실패 (${resp.status}): ${await resp.text()}`);
	}

	return (await resp.json()) as TranscriptionResult;
}
