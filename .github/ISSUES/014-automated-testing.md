# 자동화 테스트 구축

## 설명
유닛 테스트, 통합 테스트, E2E 테스트를 구축하여 코드 품질을 보장합니다.

## 현재 상태
- 테스트 프레임워크 미설정
- 테스트 파일 없음
- CI/CD 파이프라인 미구축

## 구현 필요 사항

### 테스트 프레임워크 설정
- [ ] Vitest 설치 및 설정 (Jest 대안, Vite 호환)
- [ ] React Testing Library 설치
- [ ] Playwright 설치 (E2E 테스트)

### 설정 파일
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: ['node_modules/', 'tests/'],
    },
  },
});
```

### 유닛 테스트
- [ ] 유틸리티 함수 테스트 (`lib/utils.ts`)
- [ ] 데이터베이스 헬퍼 함수 테스트
- [ ] OpenAI 클라이언트 모킹 및 테스트

### 컴포넌트 테스트
- [ ] Button 컴포넌트 테스트
- [ ] Form 컴포넌트 테스트
- [ ] Navigation 컴포넌트 테스트
- [ ] ResumeCard 컴포넌트 테스트

### API 라우트 테스트
- [ ] `POST /api/resumes` 테스트
- [ ] `GET /api/resumes/[id]` 테스트
- [ ] `POST /api/resumes/upload` 테스트
- [ ] 인증 미들웨어 테스트

### E2E 테스트 (Playwright)
- [ ] 로그인 플로우
- [ ] 이력서 업로드 플로우
- [ ] 대시보드 네비게이션
- [ ] 설정 페이지 동작

### 테스트 스크립트 추가
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  }
}
```

### 테스트 커버리지 목표
| 영역 | 목표 커버리지 |
|------|--------------|
| Utils/Helpers | 90% |
| API Routes | 80% |
| Components | 70% |
| E2E Critical Paths | 100% |

### CI/CD 통합
- [ ] GitHub Actions 워크플로우 생성
- [ ] PR 시 자동 테스트 실행
- [ ] 커버리지 리포트 댓글 추가
- [ ] 테스트 실패 시 머지 차단

## 관련 파일
- 신규: `vitest.config.ts`
- 신규: `playwright.config.ts`
- 신규: `tests/` 디렉토리
- 신규: `.github/workflows/test.yml`

## 우선순위
**Priority 5 - Quality & Testing**

## Labels
`testing`, `ci-cd`, `quality`
