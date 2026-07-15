# STT 자막 생성 데모

영상 편집 보조를 위한 STT 자막 생성 웹 서비스입니다. mp4 영상을 업로드하면 [RTZR STT API](https://openapi.vito.ai/)로 음성을 인식해 SRT 포맷의 자막 파일을 생성합니다.

## 빠른 시작

### 사전 요구사항

- Node.js LTS 버전
- pnpm ([설치 가이드](https://pnpm.io/installation))
- RTZR OpenAPI `client_id` / `client_secret` ([RTZR 콘솔](https://developers.rtzr.ai)에서 발급)

### 설치 및 실행

```sh
pnpm install

# .env.example을 복사해 .env를 만들고 RTZR_CLIENT_ID / RTZR_CLIENT_SECRET 입력
cp .env.example .env

pnpm dev
```

`http://localhost:5173`에서 접속해 mp4를 업로드하고 자막 생성을 시작하면 됩니다.

배포용 빌드는 `pnpm build`(미리보기는 `pnpm preview`)로 실행합니다.

## 더 알아보기

- [사용 방법](docs/usage.md)
- [아키텍처 / 디렉토리 구조 / SRT 생성 규칙](docs/architecture.md)
- [문제 해결](docs/troubleshooting.md)
- [출처 / 참고](docs/credits.md)
