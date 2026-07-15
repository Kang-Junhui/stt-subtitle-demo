export interface SttWord {
	start_at: number;
	duration: number;
	text: string;
}

export interface SttUtterance {
	start_at: number;
	duration: number;
	msg: string;
	spk?: number;
	lang?: string;
	words?: SttWord[];
}

const MAX_CUE_DURATION_MS = 5000;
const SENTENCE_END_RE = /[.!?]$/;

interface Cue {
	startAt: number;
	endAt: number;
	spk?: number;
	words: string[];
}

function msToSrtTimestamp(ms: number): string {
	const totalMs = Math.max(0, Math.round(ms));
	const hours = Math.floor(totalMs / 3_600_000);
	const minutes = Math.floor((totalMs % 3_600_000) / 60_000);
	const seconds = Math.floor((totalMs % 60_000) / 1_000);
	const millis = totalMs % 1_000;

	const pad = (n: number, len = 2) => n.toString().padStart(len, '0');
	return `${pad(hours)}:${pad(minutes)}:${pad(seconds)},${pad(millis, 3)}`;
}

// 자막 한 블록(cue)이 5초를 넘지 않도록, 그리고 문장이 끝나면(.!?) 새 블록으로
// 줄바꿈되도록 word 단위 타임스탬프를 기준으로 블록을 나눈다.
function buildCues(utterances: SttUtterance[]): Cue[] {
	const cues: Cue[] = [];
	let current: Cue | null = null;

	for (const utterance of utterances) {
		const words: SttWord[] = utterance.words?.length
			? utterance.words
			: [{ start_at: utterance.start_at, duration: utterance.duration, text: utterance.msg }];

		for (const word of words) {
			if (current && current.spk !== utterance.spk) {
				cues.push(current);
				current = null;
			}

			if (!current) {
				current = {
					startAt: word.start_at,
					endAt: word.start_at + word.duration,
					spk: utterance.spk,
					words: []
				};
			}

			current.words.push(word.text);
			current.endAt = word.start_at + word.duration;

			const endsSentence = SENTENCE_END_RE.test(word.text.trim());
			const exceedsMaxDuration = current.endAt - current.startAt >= MAX_CUE_DURATION_MS;

			if (endsSentence || exceedsMaxDuration) {
				cues.push(current);
				current = null;
			}
		}
	}

	if (current) cues.push(current);

	return cues;
}

export function utterancesToSrt(utterances: SttUtterance[]): string {
	return buildCues(utterances)
		.map((cue, index) => {
			const start = msToSrtTimestamp(cue.startAt);
			const end = msToSrtTimestamp(cue.endAt);
			const speakerPrefix = cue.spk !== undefined ? `[화자 ${cue.spk + 1}] ` : '';
			return `${index + 1}\n${start} --> ${end}\n${speakerPrefix}${cue.words.join(' ')}\n`;
		})
		.join('\n');
}
