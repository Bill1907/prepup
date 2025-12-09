# R2 Credentials 설정 가이드

## 현재 이슈
```
Error: R2_ACCOUNT_ID is set to a placeholder value.
Please set your actual Cloudflare Account ID from the dashboard.
```

이 에러는 `.env.local` 파일에 실제 Cloudflare 계정 정보가 설정되지 않아서 발생합니다.

## 🔑 필요한 환경 변수

```bash
# .env.local에 추가 필요
R2_ACCOUNT_ID=your_actual_account_id          # Cloudflare Account ID
R2_ACCESS_KEY_ID=your_access_key_id           # R2 API Access Key
R2_SECRET_ACCESS_KEY=your_secret_access_key   # R2 API Secret Key
```

## 📋 단계별 설정 방법

### 1단계: Cloudflare Account ID 확인

**방법 1: Dashboard에서 확인 (가장 쉬움)**

1. [Cloudflare Dashboard](https://dash.cloudflare.com) 로그인
2. 우측 상단에 있는 계정 아이콘 클릭
3. 아무 페이지나 접속하면 URL에 Account ID가 표시됨:
   ```
   https://dash.cloudflare.com/<ACCOUNT_ID>/...
   ```
4. 또는 **R2 > Overview** 페이지로 이동하면 우측 사이드바에 "Account ID" 표시

**방법 2: Wrangler CLI로 확인**

```bash
# 모든 계정 목록 확인
npx wrangler whoami

# 출력 예시:
# Account Name: Your Account Name
# Account ID: abc123def456ghi789jkl012mno345pq
```

### 2단계: R2 API Token 생성

**R2 전용 API Token이 필요합니다** (일반 API Token과 다름)

**⚠️ 중요:** Secret Access Key는 생성 시 단 한 번만 표시되므로 즉시 복사하여 저장해야 합니다!

1. [Cloudflare Dashboard](https://dash.cloudflare.com) 로그인

2. **R2 > Overview** 페이지로 이동

3. **"Manage in API tokens"** 버튼 클릭 (Overview 페이지에 있음)

4. **토큰 타입 선택:**
   - **Account API Token** (권장): 계정 레벨, Super Admin만 생성 가능, 취소할 때까지 유효
   - **User API Token**: 개인 사용자 레벨, 사용자 권한 상속, 사용자 제거 시 비활성화

5. **권한 설정:**

   **4가지 권한 레벨** (PrepUp용으로는 Object Read & Write 권장):

   | 권한 | 설명 |
   |-----|------|
   | Admin Read & Write | 버킷과 객체 관리 (전체 권한) |
   | Admin Read only | 버킷 설정과 객체 조회 |
   | **Object Read & Write** | ✅ **특정 버킷의 객체 읽기/쓰기 (권장)** |
   | Object Read only | 특정 버킷의 객체 조회만 |

6. **버킷 범위 지정** (Object 권한 선택 시):
   ```
   Apply to specific buckets only: prepup-files
   ```

7. **토큰 생성:**
   - "Create Account API token" 또는 "Create User API token" 클릭

8. **⚠️ 즉시 복사 및 저장:**
   ```
   Access Key ID: <복사>
   Secret Access Key: <복사> (⚠️ 다시 볼 수 없습니다! 지금 복사하세요!)
   ```

   → 1Password, 메모장, 또는 안전한 곳에 즉시 저장!

### 3단계: .env.local 파일 업데이트

프로젝트 루트의 `.env.local` 파일을 열어서 업데이트:

```bash
# 기존 placeholder 값 찾기
R2_ACCOUNT_ID="placeholder_account_id"
R2_ACCESS_KEY_ID="placeholder_access_key"
R2_SECRET_ACCESS_KEY="placeholder_secret_key"

# 실제 값으로 교체
R2_ACCOUNT_ID="abc123def456ghi789jkl012mno345pq"  # 1단계에서 확인한 Account ID
R2_ACCESS_KEY_ID="1234567890abcdef1234567890abcdef"  # 2단계에서 생성한 Access Key ID
R2_SECRET_ACCESS_KEY="abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRS"  # Secret Access Key
```

**⚠️ 주의사항:**
- 따옴표로 감싸기 (큰따옴표 또는 작은따옴표)
- 앞뒤 공백 없이 입력
- 실제 값이므로 Git에 커밋하지 않도록 주의 (`.env.local`은 `.gitignore`에 이미 포함됨)

### 4단계: 개발 서버 재시작

```bash
# 기존 서버 중지 (Ctrl+C)
# 새로운 환경 변수로 재시작
npm run dev
```

### 5단계: 동작 확인

브라우저에서 테스트:

```bash
# 로컬 개발: http://localhost:3000
```

1. **Resume 페이지 접속**
2. **질문 생성 테스트**
   - Resume 선택
   - "AI 질문 생성" 버튼 클릭
   - 에러 없이 질문이 생성되는지 확인

**개발자 콘솔에서 확인:**
```
[QUESTIONS] Fetching PDF from R2, fileKey: resumes/user_xxx/resume_xxx/file.pdf
[QUESTIONS] Uploading PDF to OpenAI...
[QUESTIONS] File uploaded, ID: file-xxx
[QUESTIONS] Created questions: 10
```

## 🔍 문제 해결

### 에러 1: "R2 credentials not configured"

**원인:** 환경 변수가 설정되지 않았거나 개발 서버가 재시작되지 않음

**해결:**
```bash
# 1. .env.local 파일 확인
cat .env.local | grep R2_

# 2. 출력 결과가 placeholder가 아닌 실제 값인지 확인
# 3. 개발 서버 재시작
npm run dev
```

### 에러 2: "Access Denied" 또는 403 에러

**원인:** API Token의 권한이 부족하거나 버킷 제한이 잘못 설정됨

**해결:**
1. R2 Dashboard에서 API Token 권한 확인
2. "Object Read & Write" 권한이 있는지 확인
3. Bucket restrictions가 `prepup-files`에 적용되었는지 확인
4. 필요시 새 토큰 생성

### 에러 3: "Invalid signature" 또는 SignatureDoesNotMatch

**원인:** Secret Access Key가 잘못 입력되었거나 공백 포함

**해결:**
```bash
# .env.local 파일에서 확인
# - 앞뒤 공백 제거
# - 따옴표 안에 값 입력
# - 특수문자 이스케이프 불필요

# 올바른 예:
R2_SECRET_ACCESS_KEY="abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRS"

# 잘못된 예:
R2_SECRET_ACCESS_KEY= abcdefgh...  # 앞에 공백
R2_SECRET_ACCESS_KEY="abcdefgh... " # 뒤에 공백
```

### 에러 4: "Bucket not found"

**원인:** 버킷 이름이 잘못되었거나 Account ID가 다른 계정의 것

**해결:**
```bash
# 버킷 목록 확인
npx wrangler r2 bucket list

# 출력에 'prepup-files'가 있는지 확인
# 없다면:
# 1. Account ID가 올바른지 확인
# 2. 버킷이 실제로 생성되었는지 확인
```

## 🚀 프로덕션 배포 시 설정

프로덕션 환경에서는 Cloudflare Workers의 환경 변수로 설정해야 합니다.

### Cloudflare Workers (wrangler.jsonc)

```jsonc
{
  "vars": {
    // 공개되어도 괜찮은 값들
    // R2_ACCOUNT_ID는 여기에 추가 가능
  },
  // 비밀 값들은 wrangler secret 사용
}
```

### Secret 설정 (프로덕션)

```bash
# R2 Account ID (선택사항 - vars에 추가해도 됨)
npx wrangler secret put R2_ACCOUNT_ID

# R2 Access Key ID (필수 - 비밀 값)
npx wrangler secret put R2_ACCESS_KEY_ID

# R2 Secret Access Key (필수 - 비밀 값)
npx wrangler secret put R2_SECRET_ACCESS_KEY
```

각 명령어 실행 시 값을 입력하라는 프롬프트가 표시됩니다.

## 📚 참고 자료

- [Cloudflare R2 API Tokens](https://developers.cloudflare.com/r2/api/tokens/)
- [R2 S3 API Compatibility](https://developers.cloudflare.com/r2/api/s3/)
- [Presigned URLs Documentation](https://developers.cloudflare.com/r2/api/s3/presigned-urls/)

## ✅ 체크리스트

설정 완료 후 아래 항목들을 확인하세요:

- [ ] Cloudflare Account ID 확인 및 입력
- [ ] R2 API Token 생성 (Access Key ID + Secret)
- [ ] `.env.local` 파일 업데이트 (3개 변수)
- [ ] 개발 서버 재시작
- [ ] 질문 생성 기능 테스트
- [ ] 콘솔에서 에러 없음 확인
- [ ] `.env.local`이 `.gitignore`에 포함되어 있는지 확인

## 🔐 보안 주의사항

1. **절대 Git에 커밋하지 마세요:**
   - `.env.local` 파일
   - R2 API Secrets
   - Access Keys

2. **Token 관리:**
   - 정기적으로 토큰 로테이션 권장 (6개월~1년)
   - 사용하지 않는 토큰은 즉시 삭제
   - 팀원과 공유 시 안전한 방법 사용 (1Password, Vault 등)

3. **권한 최소화:**
   - 필요한 버킷에만 접근 권한 부여
   - Read-only가 충분하면 Write 권한 제거
