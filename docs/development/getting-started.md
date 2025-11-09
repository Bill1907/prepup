# 개발 시작하기

PrepUp 프로젝트를 로컬 환경에서 시작하는 방법입니다.

## 🚀 5분 안에 시작하기

### 1. 저장소 클론

```bash
git clone <repository-url>
cd prepup
```

### 2. 의존성 설치

```bash
npm install
```

### 3. 환경 변수 설정

`.dev.vars` 파일 생성:

```bash
cp .dev.vars.example .dev.vars
```

필수 환경 변수 입력:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_key
CLERK_SECRET_KEY=sk_test_your_key
CLERK_WEBHOOK_SECRET=whsec_your_secret
```

### 4. 개발 서버 실행

**권장: 원격 D1 사용 (로컬 D1 띄우지 않음)**

로컬 개발 환경에서도 원격 D1을 사용하는 것이 더 효율적입니다:

```bash
npm run dev
```

브라우저에서 `http://localhost:3000` 열기 🎉

**참고**: 
- `wrangler.jsonc`에서 `"remote": true`로 설정되어 있어 원격 D1이 기본값입니다.
- `@cloudflare/next-on-pages`가 로컬 개발 환경에서도 동작하여 원격 D1에 자동으로 연결됩니다.

---

## 📋 상세 설정

### Node.js 버전

```bash
node --version  # v20 이상 권장
```

NVM 사용:

```bash
nvm use 20
```

### Clerk 설정

1. [Clerk Dashboard](https://dashboard.clerk.com/) 회원가입
2. 새 Application 생성
3. API Keys 복사하여 `.dev.vars`에 추가

### 데이터베이스 설정

**권장: 원격 D1 사용 (로컬 D1 띄우지 않음)**

로컬 개발 환경에서도 원격 D1을 사용하는 것이 더 효율적입니다:

```bash
# 원격 D1에 스키마 적용 (최초 1회)
npx wrangler d1 execute prepup-db --remote --file=./schema.sql

# 확인
npx wrangler d1 execute prepup-db --remote --command="SELECT COUNT(*) FROM users"
```

**로컬 D1 사용 (선택사항)**

로컬 D1을 사용하려면:

```bash
# D1 로컬 데이터베이스 생성
npx wrangler d1 execute prepup-db --local --file=./schema.sql

# 확인
npx wrangler d1 execute prepup-db --local --command="SELECT COUNT(*) FROM users"
```

**참고**: 
- `wrangler.jsonc`에서 `"remote": true`로 설정되어 있어 원격 D1이 기본값입니다.
- 원격 D1을 사용하면 로컬에서 별도 설정 없이 바로 개발할 수 있습니다.

---

## 🛠️ 개발 도구

### 필수 도구

- **VS Code**: 권장 에디터
- **Wrangler CLI**: Cloudflare 개발 도구
- **Git**: 버전 관리

### VS Code 확장 프로그램

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "cloudflare.vscode-wrangler"
  ]
}
```

### 유용한 명령어

```bash
# 개발 서버 (Turbopack)
npm run dev

# 빌드
npm run build

# 린트
npm run lint

# 타입 체크
npm run type-check

# Cloudflare 프리뷰
npm run preview
```

---

## 🏗️ 프로젝트 구조

```
prepup/
├── app/                    # Next.js App Router
│   ├── (shared)/          # 공유 레이아웃
│   ├── auth/              # 인증 페이지
│   ├── dashboard/         # 대시보드
│   ├── api/               # API Routes
│   ├── layout.tsx         # 루트 레이아웃
│   └── page.tsx           # 랜딩 페이지
├── components/            # React 컴포넌트
│   ├── ui/               # shadcn/ui 컴포넌트
│   ├── navigation.tsx    # 네비게이션
│   └── footer.tsx        # 푸터
├── lib/                   # 유틸리티
│   ├── db.ts             # 데이터베이스 헬퍼
│   └── utils.ts          # 기타 유틸
├── types/                 # TypeScript 타입
│   └── database.ts       # DB 타입
├── docs/                  # 문서
├── public/                # 정적 에셋
├── schema.sql             # 데이터베이스 스키마
├── wrangler.jsonc         # Cloudflare 설정
└── package.json           # 의존성
```

---

## 💻 개발 워크플로우

### 1. 브랜치 생성

```bash
git checkout -b feature/your-feature
```

### 2. 코드 작성

```typescript
// 컴포넌트 예제
// components/resume/resume-card.tsx
export function ResumeCard({ resume }: { resume: Resume }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{resume.title}</CardTitle>
      </CardHeader>
    </Card>
  );
}
```

### 3. 린트 & 타입 체크

```bash
npm run lint
npm run type-check
```

### 4. 커밋

```bash
git add .
git commit -m "feat: add resume card component"
```

### 5. Pull Request

```bash
git push origin feature/your-feature
```

---

## 🧪 테스팅

### 단위 테스트 (Coming Soon)

```bash
npm test
```

### E2E 테스트 (Coming Soon)

```bash
npm run test:e2e
```

### 수동 테스트 체크리스트

- [ ] 회원가입/로그인 플로우
- [ ] 이력서 업로드
- [ ] 질문 생성
- [ ] 모의 인터뷰 시작
- [ ] 반응형 디자인 확인

---

## 🐛 디버깅

### 개발 서버 로그

```bash
# 상세 로그
npm run dev -- --verbose
```

### 데이터베이스 디버깅

**원격 D1 사용 시:**

```bash
# 쿼리 실행
npx wrangler d1 execute prepup-db --remote --command="SELECT * FROM users LIMIT 5"

# 스키마 확인
npx wrangler d1 execute prepup-db --remote --command="SELECT sql FROM sqlite_master WHERE type='table'"
```

**로컬 D1 사용 시:**

```bash
# 쿼리 실행
npx wrangler d1 execute prepup-db --local --command="SELECT * FROM users LIMIT 5"

# 스키마 확인
npx wrangler d1 execute prepup-db --local --command="SELECT sql FROM sqlite_master WHERE type='table'"
```

### Clerk 디버깅

```typescript
// 개발 모드에서 사용자 정보 출력
console.log('User ID:', userId);
console.log('Session:', await auth());
```

---

## 📦 주요 의존성

### 프레임워크

- **Next.js 15**: React 프레임워크
- **React 19**: UI 라이브러리
- **TypeScript 5**: 타입 안전성

### UI

- **Tailwind CSS 4**: 스타일링
- **shadcn/ui**: UI 컴포넌트
- **Lucide React**: 아이콘

### 인증

- **Clerk**: 인증 솔루션

### 데이터베이스

- **Cloudflare D1**: SQLite 데이터베이스
- **Cloudflare R2**: 오브젝트 스토리지

---

## 🔧 트러블슈팅

### 포트가 이미 사용 중

```bash
# 다른 포트로 실행
PORT=3001 npm run dev
```

### 모듈을 찾을 수 없음

```bash
# node_modules 재설치
rm -rf node_modules package-lock.json
npm install
```

### Clerk 연결 오류

1. `.dev.vars` 파일 확인
2. Clerk Dashboard에서 키 재확인
3. 브라우저 캐시 삭제

### 타입 오류

```bash
# TypeScript 재시작 (VS Code)
Cmd/Ctrl + Shift + P → "TypeScript: Restart TS Server"

# 타입 재생성
npm run cf-typegen
```

---

## 📚 학습 리소스

### 공식 문서

- [Next.js 문서](https://nextjs.org/docs)
- [Cloudflare Workers](https://developers.cloudflare.com/workers/)
- [Clerk 문서](https://clerk.com/docs)
- [shadcn/ui](https://ui.shadcn.com/)

### 프로젝트 문서

- [데이터베이스 가이드](../database/quick-start.md)
- [API 문서](../api/endpoints.md)
- [배포 가이드](../deployment/cloudflare.md)

---

## 🤝 기여하기

### 코드 스타일

- ESLint 규칙 준수
- Prettier 포맷팅
- TypeScript strict 모드

### 커밋 컨벤션

```
feat: 새로운 기능
fix: 버그 수정
docs: 문서 수정
style: 코드 포맷팅
refactor: 리팩토링
test: 테스트 추가
chore: 빌드/설정 변경
```

### Pull Request 가이드라인

1. 이슈 생성 또는 연결
2. 기능 브랜치 생성
3. 코드 작성 및 테스트
4. PR 생성 (템플릿 사용)
5. 리뷰 대응
6. 머지

---

## ⚡ 다음 단계

- [ ] [데이터베이스 설정](../database/setup.md)
- [ ] [API 엔드포인트 이해](../api/endpoints.md)
- [ ] [컴포넌트 구조 파악](./components.md)
- [ ] [배포 준비](../deployment/cloudflare.md)

---

**준비 완료!** 이제 개발을 시작할 수 있습니다! 🚀

질문이 있으시면 [GitHub Issues](https://github.com/prepup/prepup/issues)에 올려주세요.

