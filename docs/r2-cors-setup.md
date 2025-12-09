# R2 CORS 설정 가이드

## 문제

Presigned URL API에서 500 에러 또는 CORS 에러가 발생하는 경우, R2 버킷의 CORS 정책에 프로덕션 도메인이 누락되었을 가능성이 높습니다.

## 현재 상태

```bash
# 현재 CORS 설정 확인
npx wrangler r2 bucket cors list prepup-files
```

**현재 설정된 allowed_origins:**
- http://localhost:3000
- http://localhost:3001
- https://prepup.pages.dev

**누락된 도메인:**
- https://prepup.boseong-romi.workers.dev (프로덕션 Workers 도메인)

## 해결 방법

### 방법 1: Cloudflare Dashboard에서 설정 (권장)

1. **Cloudflare Dashboard 접속**
   - https://dash.cloudflare.com 로그인
   - R2 섹션으로 이동
   - `prepup-files` 버킷 선택

2. **CORS 설정 업데이트**
   - "Settings" 탭 클릭
   - "CORS Policy" 섹션 찾기
   - "Edit" 버튼 클릭

3. **프로덕션 도메인 추가**
   - `AllowedOrigins` 배열에 추가:
     ```
     https://prepup.boseong-romi.workers.dev
     ```

4. **전체 CORS 설정 예시:**

```json
{
  "AllowedOrigins": [
    "http://localhost:3000",
    "http://localhost:3001",
    "https://prepup.pages.dev",
    "https://prepup.boseong-romi.workers.dev"
  ],
  "AllowedMethods": [
    "GET",
    "PUT",
    "HEAD",
    "DELETE"
  ],
  "AllowedHeaders": [
    "content-type",
    "x-amz-date",
    "x-amz-content-sha256",
    "authorization",
    "*"
  ],
  "ExposeHeaders": [
    "ETag",
    "x-amz-request-id"
  ],
  "MaxAgeSeconds": 3600
}
```

5. **저장 후 확인**
   ```bash
   npx wrangler r2 bucket cors list prepup-files
   ```

### 방법 2: Wrangler CLI 사용

현재 Wrangler CLI로 설정하려고 하면 JSON 형식 에러가 발생합니다. Cloudflare API 문서를 참고하여 올바른 형식을 확인해야 합니다.

참고: https://developers.cloudflare.com/api/operations/r2-put-bucket-cors-policy

## 확인 방법

CORS 설정 후, 브라우저에서:

1. 프로덕션 사이트 접속: https://prepup.boseong-romi.workers.dev
2. Resume 업로드 시도
3. PDF 미리보기 확인
4. 브라우저 개발자 도구의 Console에서 CORS 에러가 없는지 확인

## Presigned URL 에러 디버깅

개선된 에러 로깅을 추가했으므로, 실시간 로그로 정확한 에러를 확인할 수 있습니다:

```bash
# 터미널에서 실시간 로그 모니터링
npx wrangler tail --format pretty
```

그런 다음 브라우저에서 presigned URL API를 호출하여 자세한 에러 메시지를 확인하세요.

## 주의사항

- CORS 설정 변경 후 즉시 적용되지만, 브라우저 캐시로 인해 반영이 지연될 수 있습니다.
- 하드 리프레시 (Cmd+Shift+R / Ctrl+Shift+R) 또는 시크릿 모드로 테스트하세요.
- 와일드카드(`*`)는 보안상 권장하지 않으므로, 특정 도메인만 추가하세요.

## 커스텀 도메인 사용 시

만약 나중에 커스텀 도메인(예: https://prepup.com)을 사용한다면, CORS 설정에 해당 도메인도 추가해야 합니다:

```json
{
  "AllowedOrigins": [
    "http://localhost:3000",
    "http://localhost:3001",
    "https://prepup.pages.dev",
    "https://prepup.boseong-romi.workers.dev",
    "https://prepup.com",
    "https://www.prepup.com"
  ],
  ...
}
```
