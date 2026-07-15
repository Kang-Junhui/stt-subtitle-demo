# STT 자막 생성 데모

영상 편집 보조를 위한 STT 자막 생성 웹 서비스입니다. mp4 영상을 업로드하면 [RTZR STT API](https://openapi.vito.ai/)로 음성을 인식해 SRT 포맷의 자막 파일을 생성합니다.

## 주요 기능

- 테스트 영상(`static/test.mp4`) 다운로드
- mp4 파일 드래그 앤 드롭 업로드
- STT 전사 요청 후 폴링 방식(5초 간격)으로 진행 상태 확인
- 화자 분리(diarization) 자동 감지
- 간투어(음, 어 등) 필터링
- 완료 시 SRT 자막 파일 다운로드
  - 자막 한 블록은 5초를 넘지 않도록 분할
  - 문장이 끝나면(`.`, `?`, `!`) 새 블록으로 줄바꿈
  - 화자가 바뀌면 새 블록으로 분리

## 기술 스택

- SvelteKit (프론트엔드 + 서버), TypeScript
- Tailwind CSS
- 패키지 매니저: pnpm
- RTZR OpenAPI (STT)

## 사전 요구사항

- Node.js LTS 버전
- pnpm ([설치 가이드](https://pnpm.io/installation))
- RTZR OpenAPI `client_id` / `client_secret`
  - [RTZR 콘솔](https://developers.rtzr.ai)에서 회원가입 후 발급받을 수 있습니다.

## 시작하기

### 1. 의존성 설치

```sh
pnpm install
```

### 2. 환경 변수 설정

`.env.example`을 복사해 `.env` 파일을 만들고, 발급받은 값을 입력합니다.

```sh
cp .env.example .env
```

```
RTZR_CLIENT_ID=your_client_id
RTZR_CLIENT_SECRET=your_client_secret
```

> `.env`는 서버 시작 시점에 읽히므로, 값을 새로 채워 넣거나 수정한 뒤에는 개발 서버를 재시작해야 반영됩니다.

### 3. 개발 서버 실행

```sh
pnpm dev

# 브라우저 자동 실행
pnpm dev -- --open
```

기본적으로 `http://localhost:5173`에서 접속할 수 있습니다.

## 사용 방법

1. 브라우저에서 앱에 접속합니다.
2. "테스트 영상 다운로드" 링크로 예시 mp4를 내려받거나, 직접 준비한 mp4 파일을 사용합니다.
3. 업로드 박스를 클릭하거나 mp4 파일을 드래그 앤 드롭합니다.
4. "자막 생성 시작" 버튼을 클릭합니다. 업로드 → 전사 요청 → 결과 폴링 순으로 진행되며, 영상 길이에 따라 수십 초~수 분이 걸릴 수 있습니다.
5. 처리가 완료되면 생성된 SRT 내용을 미리 보고, "SRT 자막 다운로드" 버튼으로 `.srt` 파일을 내려받습니다.

## 빌드

```sh
pnpm build
```

`pnpm preview`로 빌드 결과물을 미리 확인할 수 있습니다.

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
  API-doc/                         # RTZR STT API 문서
.env.example                       # 필요한 환경 변수 예시
```

## 문제 해결

- **`RTZR_CLIENT_ID`/`RTZR_CLIENT_SECRET` 관련 오류**: `.env` 파일이 없거나 값이 비어 있는 경우 발생합니다. `.env.example`을 참고해 값을 채운 뒤 개발 서버를 재시작하세요.
- **"mp4 파일만 업로드할 수 있습니다" 오류**: 현재는 mp4 확장자/타입만 허용합니다.
- **업로드 후 응답이 오래 걸림**: STT 처리는 요청 순서대로 순차 처리되며, 트래픽이 많은 시간대에는 시작까지 지연될 수 있습니다 (RTZR API 정책).

## 출처 / 참고

- **프로젝트 스캐폴딩**: [`sv`](https://github.com/sveltejs/cli) (Svelte 공식 CLI)로 최초 생성했습니다.
- **STT 연동 로직** ([src/lib/server/rtzr.ts](src/lib/server/rtzr.ts)): RTZR 공식 API 문서([static/API-doc/stt-file.md](static/API-doc/stt-file.md))에 포함된 `RTZROpenAPIClient` Python 예시 코드의 인증 토큰 캐싱 및 폴링(polling) 구조를 참고하여 TypeScript로 작성했습니다.
- **주요 오픈소스 라이브러리**: [SvelteKit](https://github.com/sveltejs/kit), [Svelte](https://github.com/sveltejs/svelte), [Tailwind CSS](https://github.com/tailwindlabs/tailwindcss), [Paraglide JS](https://github.com/opral/inlang-paraglide-js). 정확한 라이선스 조건은 각 저장소를 확인하세요.
