# Clerk Webhook 설정 가이드

Clerk에서 사용자가 회원가입하면 자동으로 D1 데이터베이스에 사용자 정보를 저장하는 웹훅을 설정하는 방법입니다.

## 📋 목차

1. [환경 변수 설정](#1-환경-변수-설정)
2. [로컬 개발 환경 설정](#2-로컬-개발-환경-설정)
3. [Clerk Dashboard에서 Webhook 설정](#3-clerk-dashboard에서-webhook-설정)
4. [테스트 방법](#4-테스트-방법)
5. [프로덕션 환경 설정](#5-프로덕션-환경-설정)

---

## 1. 환경 변수 설정

### 로컬 개발 환경

프로젝트 루트에 `.dev.vars` 파일을 생성하고 다음 내용을 추가합니다:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
CLERK_SECRET_KEY=sk_test_your_key_here
CLERK_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

**참고**: `CLERK_WEBHOOK_SECRET`은 Clerk Dashboard에서 Webhook을 생성한 후에 받게 됩니다. 먼저 Webhook을 생성해야 합니다.

---

## 2. 로컬 개발 환경 설정

### 2-1. 개발 서버 실행

```bash
npm run dev
```

서버가 `http://localhost:3000`에서 실행됩니다.

### 2-2. Tunnel 도구 설정 (로컬 테스트용)

localhost는 외부에서 접근할 수 없으므로, Tunnel 도구를 사용하여 공개 URL을 생성해야 합니다.

#### 방법 1: Cloudflare Tunnel (권장)

```bash
# 설치 (macOS)
brew install cloudflare/cloudflare/cloudflared

# 또는 npm으로 설치
npm install -g cloudflared

# Tunnel 실행 (별도 터미널)
cloudflared tunnel --url http://localhost:3000
```

출력 예시:
```
+--------------------------------------------------------------------------------------------+
|  Your quick Tunnel has been created! Visit it at (it may take some time to be reachable): |
|  https://xxxxx.trycloudflare.com                                                          |
+--------------------------------------------------------------------------------------------+
```

#### 방법 2: ngrok

```bash
# 설치 (macOS)
brew install ngrok

# Tunnel 실행 (별도 터미널)
ngrok http 3000
```

#### 방법 3: localtunnel

```bash
# 설치
npm install -g localtunnel

# Tunnel 실행 (별도 터미널)
lt --port 3000
```

---

## 3. Clerk Dashboard에서 Webhook 설정

### 3-1. Clerk Dashboard 접속

1. [Clerk Dashboard](https://dashboard.clerk.com/)에 로그인
2. 프로젝트 선택

### 3-2. Webhook 엔드포인트 생성

1. 왼쪽 메뉴에서 **"Webhooks"** 클릭
2. **"Add Endpoint"** 버튼 클릭

### 3-3. Webhook 설정 입력

#### 로컬 개발 환경 (Tunnel 사용 시)

- **Endpoint URL**: 
  ```
  https://xxxxx.trycloudflare.com/api/webhooks/clerk
  ```
  (Tunnel 도구에서 받은 URL + `/api/webhooks/clerk`)

#### 프로덕션 환경

- **Endpoint URL**: 
  ```
  https://your-domain.com/api/webhooks/clerk
  ```

### 3-4. 이벤트 선택

다음 이벤트들을 선택합니다:

- ✅ `user.created` - 사용자 회원가입 시
- ✅ `user.updated` - 사용자 정보 업데이트 시
- ✅ `user.deleted` - 사용자 삭제 시

### 3-5. Webhook Secret 복사

Webhook을 생성하면 **"Signing Secret"**이 표시됩니다. 이 값을 복사합니다.

예시: `whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### 3-6. 환경 변수에 추가

복사한 Webhook Secret을 `.dev.vars` 파일에 추가합니다:

```env
CLERK_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**중요**: 개발 서버를 재시작해야 환경 변수가 적용됩니다.

---

## 4. 테스트 방법

### 4-1. 개발 서버 및 Tunnel 실행 확인

1. 개발 서버 실행 중: `npm run dev`
2. Tunnel 도구 실행 중: `cloudflared tunnel --url http://localhost:3000` (또는 다른 도구)

### 4-2. 테스트 사용자 생성

1. Clerk Dashboard에서 **"Users"** 메뉴로 이동
2. **"Create user"** 버튼 클릭
3. 테스트 사용자 정보 입력 (이메일, 이름 등)
4. 사용자 생성

### 4-3. 로그 확인

개발 서버 터미널에서 다음 메시지가 표시되어야 합니다:

```
User created in D1: user_xxxxxxxxxxxxx
```

### 4-4. 데이터베이스 확인

```bash
# 원격 D1 확인 (권장)
npx wrangler d1 execute prepup-db --remote --command="SELECT * FROM users ORDER BY created_at DESC LIMIT 5"

# 로컬 D1 확인 (로컬 D1 사용 시)
npx wrangler d1 execute prepup-db --local --command="SELECT * FROM users ORDER BY created_at DESC LIMIT 5"
```

### 4-5. Webhook 로그 확인

Clerk Dashboard에서:
1. **"Webhooks"** 메뉴로 이동
2. 생성한 Webhook 클릭
3. **"Recent deliveries"** 탭에서 요청 로그 확인
   - 성공: 초록색 체크 표시
   - 실패: 빨간색 X 표시 (에러 메시지 확인)

---

## 5. 프로덕션 환경 설정

### 5-1. Cloudflare에 Secret 설정

```bash
# Cloudflare Workers에 Secret 추가
npx wrangler secret put CLERK_WEBHOOK_SECRET
# 프롬프트가 나타나면 Webhook Secret 입력
```

### 5-2. Clerk Dashboard에서 Webhook URL 업데이트

1. Clerk Dashboard → **"Webhooks"**
2. 기존 Webhook 클릭 또는 새로 생성
3. **Endpoint URL**을 프로덕션 도메인으로 변경:
   ```
   https://your-production-domain.com/api/webhooks/clerk
   ```

### 5-3. 배포

```bash
npm run deploy
```

---

## 🔍 문제 해결

### Webhook이 동작하지 않는 경우

1. **Tunnel이 실행 중인지 확인**
   ```bash
   # Tunnel 프로세스 확인
   ps aux | grep cloudflared
   ```

2. **환경 변수 확인**
   - `.dev.vars` 파일에 `CLERK_WEBHOOK_SECRET`이 올바르게 설정되었는지 확인
   - 개발 서버를 재시작했는지 확인

3. **Clerk Dashboard에서 Webhook 로그 확인**
   - Webhook → Recent deliveries에서 에러 메시지 확인
   - HTTP 상태 코드 확인 (200이어야 함)

4. **개발 서버 로그 확인**
   - 터미널에서 에러 메시지 확인
   - "Error verifying webhook" 메시지가 있으면 Secret이 잘못되었을 수 있음

### 일반적인 에러

#### "CLERK_WEBHOOK_SECRET is not configured"
- `.dev.vars` 파일에 `CLERK_WEBHOOK_SECRET` 추가
- 개발 서버 재시작

#### "Error: Verification failed"
- Clerk Dashboard에서 Webhook Secret이 올바른지 확인
- `.dev.vars`의 Secret과 Dashboard의 Secret이 일치하는지 확인

#### "Missing svix headers"
- Clerk에서 보낸 요청이 아닐 수 있음
- Webhook URL이 올바른지 확인

#### "D1 database is not available"
- `getDrizzleDB()` 함수가 제대로 동작하는지 확인
- 원격 D1이 설정되어 있는지 확인: `npx wrangler d1 list`

---

## 📝 체크리스트

로컬 개발 환경:
- [ ] `.dev.vars` 파일에 `CLERK_WEBHOOK_SECRET` 추가
- [ ] 개발 서버 실행 (`npm run dev`)
- [ ] Tunnel 도구 실행 (cloudflared/ngrok/localtunnel)
- [ ] Clerk Dashboard에서 Webhook 생성
- [ ] Webhook URL이 Tunnel URL + `/api/webhooks/clerk`인지 확인
- [ ] 이벤트 선택: `user.created`, `user.updated`, `user.deleted`
- [ ] 테스트 사용자 생성하여 동작 확인

프로덕션 환경:
- [ ] Cloudflare에 `CLERK_WEBHOOK_SECRET` Secret 설정
- [ ] Clerk Dashboard에서 Webhook URL을 프로덕션 도메인으로 업데이트
- [ ] 배포 후 테스트

---

## 📚 참고 자료

- [Clerk Webhooks 공식 문서](https://clerk.com/docs/integration/webhooks)
- [Svix 문서](https://docs.svix.com/)
- [Cloudflare Tunnel 문서](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/)
- [로컬 Webhook 테스트 가이드](../development/webhook-local-testing.md)

---

**준비 완료!** 이제 Clerk에서 사용자가 회원가입하면 자동으로 D1 데이터베이스에 저장됩니다! 🎉

