# R2 CORS 설정 가이드

Presigned URL을 사용한 파일 업로드 시 CORS 에러를 해결하기 위한 설정 가이드입니다.

## 방법 1: Cloudflare Dashboard에서 설정 (권장)

1. [Cloudflare Dashboard](https://dash.cloudflare.com/)에 로그인
2. R2 → `prepup-files` 버킷 선택
3. Settings 탭 → CORS Policy 섹션
4. "Add CORS policy" 클릭
5. 다음 JSON을 입력:

```json
[
  {
    "AllowedOrigins": [
      "http://localhost:3000",
      "http://localhost:3001",
      "https://prepup.pages.dev"
    ],
    "AllowedMethods": ["GET", "PUT", "HEAD", "DELETE"],
    "AllowedHeaders": [
      "content-type",
      "x-amz-date",
      "x-amz-content-sha256",
      "authorization"
    ],
    "ExposeHeaders": ["ETag", "x-amz-request-id"],
    "MaxAgeSeconds": 3600
  }
]
```

6. Save 클릭

## 방법 2: Wrangler CLI로 설정

```bash
npx wrangler r2 bucket cors set prepup-files --file r2-cors-config.json
```

**참고**: 현재 wrangler CLI의 CORS 설정 명령어가 불안정할 수 있으므로, Dashboard에서 설정하는 것을 권장합니다.

## CORS 설정 확인

```bash
npx wrangler r2 bucket cors list prepup-files
```

## 프로덕션 도메인 추가

프로덕션 도메인이 있으면 `AllowedOrigins`에 추가하세요:

```json
"AllowedOrigins": [
  "http://localhost:3000",
  "http://localhost:3001",
  "https://prepup.pages.dev",
  "https://your-production-domain.com"
]
```

## 문제 해결

- CORS 설정 변경 후 최대 30초 정도 소요될 수 있습니다
- 브라우저 캐시를 지우고 다시 시도하세요
- `AllowedHeaders`에 와일드카드(`*`) 사용 시 문제가 발생할 수 있으므로 명시적으로 지정하는 것을 권장합니다
