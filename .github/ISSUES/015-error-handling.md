# 에러 처리 개선

## 설명
전체 애플리케이션의 에러 처리를 개선하여 사용자 경험과 디버깅 효율을 높입니다.

## 현재 상태
- 기본 에러 페이지 존재 (`app/error.tsx`, `app/not-found.tsx`)
- API 라우트의 에러 처리가 일관성 없음
- 에러 바운더리 미구현
- 사용자 친화적 에러 메시지 부족

## 구현 필요 사항

### 에러 바운더리 구현
```typescript
// components/ErrorBoundary.tsx
'use client';

import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // 에러 로깅 서비스로 전송
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <DefaultErrorFallback />;
    }
    return this.props.children;
  }
}
```

### API 에러 처리 표준화
```typescript
// lib/api-error.ts
export class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code: string
  ) {
    super(message);
  }
}

// 표준 에러 응답
export function errorResponse(error: APIError) {
  return Response.json(
    {
      error: {
        message: error.message,
        code: error.code,
      },
    },
    { status: error.statusCode }
  );
}
```

### 에러 코드 정의
| 코드 | HTTP Status | 설명 |
|------|-------------|------|
| `AUTH_REQUIRED` | 401 | 인증 필요 |
| `AUTH_INVALID` | 401 | 유효하지 않은 인증 |
| `FORBIDDEN` | 403 | 권한 없음 |
| `NOT_FOUND` | 404 | 리소스 없음 |
| `VALIDATION_ERROR` | 400 | 유효성 검사 실패 |
| `FILE_TOO_LARGE` | 413 | 파일 크기 초과 |
| `RATE_LIMITED` | 429 | 요청 제한 초과 |
| `INTERNAL_ERROR` | 500 | 서버 에러 |

### Frontend 에러 표시
- [ ] 전역 에러 토스트 컴포넌트
- [ ] 폼 검증 에러 인라인 표시
- [ ] 네트워크 에러 재시도 버튼
- [ ] 404 페이지 개선 (추천 페이지 링크)
- [ ] 500 페이지 개선 (고객 지원 연결)

### 에러 모니터링
- [ ] Sentry 연동
- [ ] 에러 발생 시 Slack 알림
- [ ] 에러 대시보드 설정

### 로딩 상태 개선
- [ ] Skeleton 컴포넌트 추가
- [ ] 페이지별 로딩 상태
- [ ] API 호출 중 버튼 disabled 상태
- [ ] Optimistic UI 업데이트

## 관련 파일
- `app/error.tsx`
- `app/not-found.tsx`
- 신규: `components/ErrorBoundary.tsx`
- 신규: `lib/api-error.ts`

## 우선순위
**Priority 5 - Quality & Testing**

## Labels
`enhancement`, `ux`, `error-handling`
