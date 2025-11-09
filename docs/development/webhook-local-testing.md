# Localhost에서 Clerk Webhook 테스트하기

## 개요

localhost에서 Clerk webhook을 테스트하려면 외부에서 접근 가능한 공개 URL이 필요합니다. 이를 위해 tunneling 도구를 사용합니다.

## 방법 1: Cloudflare Tunnel (권장)

Cloudflare Tunnel은 무료이고 빠르며 안정적입니다.

### 설치 및 실행

```bash
# Cloudflare Tunnel 설치 (macOS)
brew install cloudflare/cloudflare/cloudflared

# 또는 npm으로 설치
npm install -g cloudflared
```

### 사용 방법

1. 개발 서버 실행:
```bash
npm run dev
```

2. 별도 터미널에서 tunnel 실행:
```bash
cloudflared tunnel --url http://localhost:3000
```

3. 출력된 URL을 복사 (예: `https://xxxxx.trycloudflare.com`)

4. Clerk Dashboard에서 Webhook 설정:
   - URL: `https://xxxxx.trycloudflare.com/api/webhooks/clerk`
   - 이벤트: `user.created`, `user.updated`, `user.deleted`
   - Webhook Secret 복사하여 `.dev.vars`에 추가

## 방법 2: ngrok

### 설치

```bash
# macOS
brew install ngrok

# 또는 직접 다운로드
# https://ngrok.com/download
```

### 사용 방법

```bash
# 개발 서버 실행
npm run dev

# 별도 터미널에서 ngrok 실행
ngrok http 3000
```

ngrok이 제공하는 `https://xxxxx.ngrok.io` URL을 Clerk Dashboard에 설정합니다.

## 방법 3: localtunnel

### 설치

```bash
npm install -g localtunnel
```

### 사용 방법

```bash
# 개발 서버 실행
npm run dev

# 별도 터미널에서 localtunnel 실행
lt --port 3000
```

## 환경 변수 설정

`.dev.vars` 파일에 Webhook Secret 추가:

```env
CLERK_WEBHOOK_SECRET=whsec_your_secret_here
```

## 테스트 방법

1. 개발 서버 실행 (`npm run dev`)
2. Tunnel 도구 실행하여 공개 URL 생성
3. Clerk Dashboard에서 Webhook 엔드포인트 설정
4. Clerk에서 테스트 사용자 생성
5. 터미널 로그에서 "User created in D1" 메시지 확인
6. D1 데이터베이스에서 사용자 확인:

```bash
npx wrangler d1 execute prepup-db --local --command="SELECT * FROM users"
```

## 주의사항

- Tunnel URL은 매번 실행할 때마다 변경될 수 있습니다
- 개발 중에는 동일한 URL을 유지하려면 ngrok의 무료 계정을 사용하거나 Cloudflare Tunnel의 영구 URL을 설정할 수 있습니다
- 프로덕션 환경에서는 실제 도메인을 사용합니다

## 문제 해결

### Webhook이 동작하지 않는 경우

1. Tunnel이 실행 중인지 확인
2. `.dev.vars`에 `CLERK_WEBHOOK_SECRET`이 올바르게 설정되었는지 확인
3. Clerk Dashboard에서 Webhook 로그 확인
4. 개발 서버 콘솔에서 에러 메시지 확인

### 환경 변수를 찾을 수 없는 경우

- `.dev.vars` 파일이 프로젝트 루트에 있는지 확인
- Next.js 개발 서버를 재시작

