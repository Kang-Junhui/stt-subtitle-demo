<script lang="ts">
	import { utterancesToSrt, type SttUtterance } from '$lib/srt';

	type Status = 'idle' | 'uploading' | 'transcribing' | 'completed' | 'failed';

	let selectedFile = $state<File | null>(null);
	let isDragging = $state(false);
	let status = $state<Status>('idle');
	let errorMessage = $state<string | null>(null);
	let srtContent = $state<string | null>(null);
	let srtFileName = $state('');

	let fileInput: HTMLInputElement;

	function pickFile(files: FileList | null) {
		const file = files?.[0];
		if (!file) return;

		if (!file.type.includes('mp4') && !file.name.toLowerCase().endsWith('.mp4')) {
			errorMessage = 'mp4 파일만 업로드할 수 있습니다.';
			return;
		}

		selectedFile = file;
		errorMessage = null;
		status = 'idle';
		srtContent = null;
	}

	function onDrop(e: DragEvent) {
		e.preventDefault();
		isDragging = false;
		pickFile(e.dataTransfer?.files ?? null);
	}

	async function startTranscription() {
		if (!selectedFile) return;

		status = 'uploading';
		errorMessage = null;
		srtContent = null;

		try {
			const form = new FormData();
			form.append('file', selectedFile);

			const submitResp = await fetch('/api/transcribe', { method: 'POST', body: form });
			if (!submitResp.ok) {
				throw new Error((await submitResp.json().catch(() => null))?.message ?? '전사 요청에 실패했습니다.');
			}
			const { id } = (await submitResp.json()) as { id: string };

			status = 'transcribing';

			const utterances = await pollUntilDone(id);
			srtContent = utterancesToSrt(utterances);
			srtFileName = selectedFile.name.replace(/\.mp4$/i, '') + '.srt';
			status = 'completed';
		} catch (err) {
			errorMessage = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
			status = 'failed';
		}
	}

	async function pollUntilDone(id: string): Promise<SttUtterance[]> {
		const POLL_INTERVAL_MS = 5000;

		while (true) {
			const resp = await fetch(`/api/transcribe/${id}`);
			if (!resp.ok) {
				throw new Error('전사 결과 조회에 실패했습니다.');
			}
			const result = (await resp.json()) as {
				status: 'transcribing' | 'completed' | 'failed';
				results?: { utterances: SttUtterance[] };
				error?: { message: string };
			};

			if (result.status === 'completed') {
				return result.results?.utterances ?? [];
			}
			if (result.status === 'failed') {
				throw new Error(result.error?.message ?? '전사에 실패했습니다.');
			}

			await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
		}
	}

	function downloadSrt() {
		if (!srtContent) return;

		const blob = new Blob([srtContent], { type: 'text/plain;charset=utf-8' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = srtFileName || 'subtitles.srt';
		a.click();
		URL.revokeObjectURL(url);
	}
</script>

<svelte:head>
	<title>STT 자막 생성 데모</title>
</svelte:head>

<main class="mx-auto flex min-h-screen max-w-2xl flex-col gap-8 px-4 py-16">
	<div class="space-y-2">
		<h1 class="text-2xl font-bold text-gray-900">STT 자막(SRT) 생성 데모</h1>
		<p class="text-sm text-gray-600">
			mp4 영상을 업로드하면 음성을 인식해 SRT 포맷의 자막 파일을 생성합니다.
		</p>
	</div>

	<a
		href="/test.mp4"
		download
		class="inline-flex w-fit items-center gap-2 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
	>
		테스트 영상 다운로드 (test.mp4)
	</a>

	<div
		role="button"
		tabindex="0"
		aria-label="mp4 파일 업로드"
		class="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-6 py-12 text-center transition-colors {isDragging
			? 'border-blue-500 bg-blue-50'
			: 'border-gray-300 bg-gray-50'}"
		ondragover={(e) => {
			e.preventDefault();
			isDragging = true;
		}}
		ondragleave={() => (isDragging = false)}
		ondrop={onDrop}
		onclick={() => fileInput.click()}
		onkeydown={(e) => e.key === 'Enter' && fileInput.click()}
	>
		<input
			bind:this={fileInput}
			type="file"
			accept="video/mp4,.mp4"
			class="hidden"
			onchange={(e) => pickFile((e.target as HTMLInputElement).files)}
		/>
		{#if selectedFile}
			<p class="font-medium text-gray-900">{selectedFile.name}</p>
			<p class="text-xs text-gray-500">{(selectedFile.size / 1024 / 1024).toFixed(1)} MB</p>
		{:else}
			<p class="text-gray-700">mp4 파일을 드래그하거나 클릭하여 업로드하세요</p>
		{/if}
	</div>

	<button
		type="button"
		class="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
		disabled={!selectedFile || status === 'uploading' || status === 'transcribing'}
		onclick={startTranscription}
	>
		{#if status === 'uploading'}
			업로드 중...
		{:else if status === 'transcribing'}
			자막 생성 중... (최대 몇 분 소요될 수 있어요)
		{:else}
			자막 생성 시작
		{/if}
	</button>

	{#if errorMessage}
		<p class="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage}</p>
	{/if}

	{#if status === 'completed' && srtContent}
		<div class="space-y-3 rounded-md border border-green-200 bg-green-50 p-4">
			<p class="text-sm font-medium text-green-800">자막 생성이 완료되었습니다!</p>
			<button
				type="button"
				class="rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-500"
				onclick={downloadSrt}
			>
				SRT 자막 다운로드
			</button>
			<pre class="max-h-64 overflow-auto rounded bg-white p-3 text-xs whitespace-pre-wrap text-gray-700">{srtContent}</pre>
		</div>
	{/if}
</main>
