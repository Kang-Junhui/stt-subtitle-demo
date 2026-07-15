# 아키텍처

## 기술 스택

- SvelteKit (프론트엔드 + 서버), TypeScript
- Tailwind CSS
- 패키지 매니저: pnpm
- RTZR OpenAPI (STT)

## 처리 흐름

```
[브라우저] --mp4--> [POST /api/transcribe] --인증+전사요청--> [RTZR OpenAPI]
                            |                                      |
                            v                                      v
                     { id } 반환                             전사 작업 큐잉
[브라우저] --5초 폴링--> [GET /api/transcribe/[id]] --조회--> [RTZR OpenAPI]
                            |
                            v
                  completed 시 utterances(words 포함) 반환
                            |
                            v
              [클라이언트: utterancesToSrt()] → SRT 텍스트 → 다운로드
```

RTZR `client_id`/`client_secret`은 서버 코드(`src/lib/server/rtzr.ts`)에서만 사용되며 브라우저로 전달되지 않습니다.

## 디렉토리 구조

```
src/
  routes/
    +page.svelte                   # 업로드/자막 생성 메인 화면
    api/transcribe/+server.ts      # STT 전사 요청 API (mp4 업로드 → RTZR 전사 요청)
    api/transcribe/[id]/+server.ts # 전사 상태/결과 폴링 API
  lib/
    srt.ts                         # utterances → SRT 변환 유틸
    server/rtzr.ts                 # RTZR OpenAPI 인증/전사 클라이언트 (서버 전용)
static/
  test.mp4                         # 테스트 영상 파일
.env.example                       # 필요한 환경 변수 예시
```

## STT 요청 설정값

`src/routes/api/transcribe/+server.ts`에서 아래 설정으로 요청합니다.

| 옵션 | 값 | 근거 |
| --- | --- | --- |
| `model_name` | `sommers` | 한국어 데모 영상 기준 기본 모델 |
| `language` | `ko` | 테스트 영상이 한국어 |
| `use_diarization` | `true`, `spk_count: 0` | 한 문장에 여러 화자 발화가 섞여 나오는 문제 해결을 위해 활성화 (화자 수는 자동 예측) |
| `use_disfluency_filter` | `true` | "음", "어" 등 간투어 제거 |
| `use_word_timestamp` | `true` | SRT 블록을 5초 제한 + 문장 단위로 직접 재구성하기 위해 word 단위 타임스탬프 필요 |

## SRT 생성 규칙

`src/lib/srt.ts`가 RTZR 응답의 `utterance.words`(단어별 타임스탬프)를 기준으로 자막 블록(cue)을 직접 조립합니다. 아래 조건 중 먼저 만족하는 시점에 블록이 나뉩니다.

1. 화자가 바뀌는 경우
2. 블록 누적 길이가 5초(5000ms)를 넘는 경우
3. 단어가 `.`, `?`, `!`로 끝나(문장 종료) 경우
