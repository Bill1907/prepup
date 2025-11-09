# Cloudflare Workers 배포 가이드

PrepUp을 Cloudflare Workers에 배포하는 방법입니다.

## 📋 목차
- [사전 요구사항](#사전-요구사항)
- [Cloudflare 설정](#cloudflare-설정)
- [D1 데이터베이스 설정](#d1-데이터베이스-설정)
- [R2 스토리지 설정](#r2-스토리지-설정)
- [환경 변수 설정](#환경-변수-설정)
- [배포 실행](#배포-실행)
- [도메인 설정](#도메인-설정)
- [롤백](#롤백)
- [모니터링](#모니터링)

## 사전 요구사항

### 필수 도구
- Node.js 20+
- npm
- Wrangler CLI

### Cloudflare 계정
1. [Cloudflare](https://cloudflare.com) 계정 생성
2. Workers & Pages 활성화
3. 결제 정보 등록 (필요시)

---

## Cloudflare 설정

### 1. Wrangler CLI 설치

```bash
npm install -g wrangler
```

### 2. Cloudflare 로그인

```bash
wrangler login
```

브라우저가 열리고 Cloudflare 계정으로 로그인합니다.

### 3. 계정 ID 확인

```bash
wrangler whoami
```

`wrangler.jsonc` 파일에 계정 ID가 자동으로 설정됩니다.

---

## D1 데이터베이스 설정

### 1. D1 데이터베이스 생성

```bash
npx wrangler d1 create prepup-db
```

출력 예시:
```
✅ Successfully created DB 'prepup-db'

[[d1_databases]]
binding = "DB"
database_name = "prepup-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

### 2. wrangler.jsonc 업데이트

`database_id`를 복사하여 `wrangler.jsonc`에 입력:

```jsonc
"d1_databases": [
  {
    "binding": "DB",
    "database_name": "prepup-db",
    "database_id": "여기에-복사한-id-입력"
  }
]
```

### 3. 스키마 적용

```bash
# 프로덕션 데이터베이스에 스키마 적용
npx wrangler d1 execute prepup-db --remote --file=./schema.sql
```

### 4. 데이터베이스 확인

```bash
# 테이블 목록 확인
npx wrangler d1 execute prepup-db --remote --command="SELECT name FROM sqlite_master WHERE type='table'"

# 사용자 수 확인
npx wrangler d1 execute prepup-db --remote --command="SELECT COUNT(*) as user_count FROM users"
```

---

## R2 스토리지 설정

### 1. R2 버킷 생성

```bash
# 이력서 파일 저장용
npx wrangler r2 bucket create prepup-files

# 인터뷰 녹화 파일용 (선택사항)
npx wrangler r2 bucket create prepup-recordings
```

### 2. wrangler.jsonc 확인

```jsonc
"r2_buckets": [
  {
    "binding": "FILES",
    "bucket_name": "prepup-files"
  }
]
```

### 3. CORS 설정 (필요시)

```bash
# cors-config.json 생성
cat > cors-config.json << 'EOF'
[
  {
    "AllowedOrigins": ["https://your-domain.com"],
    "AllowedMethods": ["GET", "PUT", "DELETE"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3600
  }
]
EOF

# CORS 적용
npx wrangler r2 bucket cors put prepup-files --config cors-config.json
```

---

## 환경 변수 설정

### 1. Secrets 설정

민감한 정보는 Wrangler Secrets로 관리:

```bash
# Clerk Secret Key
npx wrangler secret put CLERK_SECRET_KEY
# 프롬프트에서 값 입력

# Clerk Webhook Secret
npx wrangler secret put CLERK_WEBHOOK_SECRET

# 기타 API 키들
npx wrangler secret put OPENAI_API_KEY
npx wrangler secret put TOSS_PAYMENTS_SECRET_KEY
```

### 2. 환경 변수 설정

공개 환경 변수는 `wrangler.jsonc`에 추가:

```jsonc
{
  "vars": {
    "NEXT_PUBLIC_API_URL": "https://your-domain.com",
    "ENVIRONMENT": "production"
  }
}
```

### 3. 환경별 설정

```jsonc
{
  "env": {
    "production": {
      "vars": {
        "ENVIRONMENT": "production"
      },
      "d1_databases": [
        {
          "binding": "DB",
          "database_name": "prepup-db-prod",
          "database_id": "prod-database-id"
        }
      ]
    },
    "staging": {
      "vars": {
        "ENVIRONMENT": "staging"
      },
      "d1_databases": [
        {
          "binding": "DB",
          "database_name": "prepup-db-staging",
          "database_id": "staging-database-id"
        }
      ]
    }
  }
}
```

---

## 배포 실행

### 1. 빌드 & 배포

```bash
# 프로덕션 배포
npm run deploy

# 또는 단계별로
npm run build
npx wrangler deploy
```

### 2. 특정 환경 배포

```bash
# Staging 환경
npx wrangler deploy --env staging

# Production 환경
npx wrangler deploy --env production
```

### 3. 배포 확인

```bash
# 배포된 Worker 정보 확인
npx wrangler deployments list

# 로그 확인
npx wrangler tail
```

배포 완료 후 제공되는 URL로 접속하여 확인:
```
https://prepup.your-subdomain.workers.dev
```

---

## 도메인 설정

### 1. 커스텀 도메인 추가

Cloudflare Dashboard:
1. Workers & Pages → prepup
2. Settings → Domains & Routes
3. Add Custom Domain
4. 도메인 입력 (예: `prepup.com`)
5. DNS 레코드 자동 생성

### 2. 도메인 확인

```bash
# DNS 전파 확인
nslookup prepup.com

# HTTPS 확인
curl -I https://prepup.com
```

### 3. SSL/TLS 설정

Cloudflare가 자동으로 SSL 인증서를 발급합니다.

---

## 롤백

### 1. 이전 배포 버전 확인

```bash
npx wrangler deployments list
```

### 2. 특정 버전으로 롤백

```bash
npx wrangler rollback [deployment-id]
```

### 3. 긴급 롤백 절차

```bash
# 1. 현재 배포 중단
npx wrangler delete

# 2. 이전 버전 재배포
git checkout <previous-commit>
npm run deploy
```

---

## 모니터링

### 1. 실시간 로그 확인

```bash
# 실시간 로그 스트림
npx wrangler tail

# 특정 환경
npx wrangler tail --env production

# 필터링
npx wrangler tail --status error
```

### 2. Analytics 확인

Cloudflare Dashboard:
- Workers & Pages → prepup → Analytics
- 요청 수, 에러율, 응답 시간 확인

### 3. 알림 설정

Cloudflare Dashboard:
- Notifications
- Workers 알림 설정
- 에러율 임계값 설정

---

## 성능 최적화

### 1. 캐싱 설정

```typescript
// app/api/resumes/route.ts
export async function GET(request: Request) {
  const response = await fetch(/* ... */);
  
  return new Response(response.body, {
    headers: {
      'Cache-Control': 'public, max-age=3600',
      'CDN-Cache-Control': 'public, max-age=86400',
    },
  });
}
```

### 2. 정적 에셋 최적화

`wrangler.jsonc`:
```jsonc
{
  "assets": {
    "binding": "ASSETS",
    "directory": ".open-next/assets",
    "html_handling": "auto-trailing-slash",
    "not_found_handling": "single-page-application"
  }
}
```

### 3. 요청 제한 (Rate Limiting)

```typescript
// middleware.ts
import { Ratelimit } from "@upstash/ratelimit";

const ratelimit = new Ratelimit({
  redis: /* ... */,
  limiter: Ratelimit.slidingWindow(10, "10 s"),
});

export async function middleware(request: Request) {
  const { success } = await ratelimit.limit(ip);
  if (!success) {
    return new Response("Rate limit exceeded", { status: 429 });
  }
}
```

---

## 비용 최적화

### 1. Workers 요금제

| 요금제 | 요청 수 | 비용 |
|--------|---------|------|
| Free | 100,000/day | $0 |
| Paid | 무제한 | $5/month + $0.50/million |

### 2. D1 요금제

| 항목 | Free | Paid |
|------|------|------|
| 읽기 | 5M/day | 무제한 |
| 쓰기 | 100K/day | 무제한 |
| 스토리지 | 5GB | 무제한 |

### 3. R2 요금제

| 항목 | 비용 |
|------|------|
| 스토리지 | $0.015/GB/month |
| Class A 작업 | $4.50/million |
| Class B 작업 | $0.36/million |
| 송신 | $0 (Cloudflare 내부) |

### 4. 비용 절감 팁

- 캐싱 적극 활용
- 불필요한 쿼리 최소화
- 이미지 최적화 (WebP, 압축)
- R2 송신 비용 $0 활용

---

## 트러블슈팅

### 배포 실패

```bash
# 빌드 로그 확인
npm run build

# Wrangler 로그 확인
npx wrangler deploy --verbose
```

### 데이터베이스 연결 오류

```bash
# D1 바인딩 확인
npx wrangler d1 info prepup-db

# 연결 테스트
npx wrangler d1 execute prepup-db --remote --command="SELECT 1"
```

### R2 접근 오류

```bash
# R2 버킷 확인
npx wrangler r2 bucket list

# 버킷 내용 확인
npx wrangler r2 object list prepup-files
```

### 환경 변수 오류

```bash
# Secrets 목록 확인
npx wrangler secret list

# Secret 업데이트
npx wrangler secret put KEY_NAME
```

---

## CI/CD 설정

### GitHub Actions

`.github/workflows/deploy.yml`:

```yaml
name: Deploy to Cloudflare

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Build
        run: npm run build
        
      - name: Deploy to Cloudflare
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          command: deploy
```

### Secrets 설정

GitHub Repository Settings:
- Secrets and variables → Actions
- New repository secret
- `CLOUDFLARE_API_TOKEN` 추가

---

## 체크리스트

배포 전 확인사항:

- [ ] D1 데이터베이스 생성 및 스키마 적용
- [ ] R2 버킷 생성
- [ ] 환경 변수 및 Secrets 설정
- [ ] `wrangler.jsonc` 설정 확인
- [ ] 로컬 빌드 테스트 (`npm run build`)
- [ ] Clerk Webhook URL 업데이트
- [ ] 도메인 DNS 설정
- [ ] SSL 인증서 확인
- [ ] 배포 후 smoke test 실행

---

## 관련 문서

- [환경 변수 관리](./environment.md)
- [CI/CD 설정](./cicd.md)
- [데이터베이스 설정](../database/setup.md)
- [Cloudflare Workers 공식 문서](https://developers.cloudflare.com/workers/)

---

**마지막 업데이트**: 2025년 11월 9일

