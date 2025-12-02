# 디버그 로깅 정리 및 구조화된 로깅 구현

## 설명
프로덕션 코드에서 디버그 로그를 정리하고, 구조화된 로깅 시스템을 도입합니다.

## 현재 상태
`app/api/files/[...path]/route.ts`에 다수의 DEBUG 로그 존재:
```typescript
console.log(`[DEBUG] Original path array:`, path);
console.log(`[DEBUG] Decoded path array:`, decodedPath);
console.log(`[DEBUG] Final file path:`, filePath);
console.log(`[DEBUG] Attempting to fetch file from R2: ${filePath}`);
console.log(`[DEBUG] Path parts:`, pathParts);
console.log(`[DEBUG] File user ID: ${fileUserId}, Current user ID: ${userId}`);
console.error(`[DEBUG] File not found in R2: ${filePath}`);
```

## 구현 필요 사항

### 즉시 조치
- [ ] 프로덕션 배포 전 모든 DEBUG console.log 제거
- [ ] 민감한 정보(userId, filePath) 로깅 검토

### 구조화된 로깅 도입
- [ ] 로깅 라이브러리 선택 (pino, winston 등)
- [ ] 로그 레벨 설정 (debug, info, warn, error)
- [ ] 환경별 로그 레벨 분리
  - development: debug
  - production: info/warn

### 로깅 유틸리티 생성
```typescript
// lib/logger.ts
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => ({ level: label }),
  },
});

// 사용 예시
logger.info({ userId, action: 'file_download' }, 'File downloaded');
logger.error({ error, filePath }, 'Failed to fetch file');
```

### 에러 추적 통합
- [ ] Sentry 또는 LogRocket 연동 고려
- [ ] 에러 발생 시 자동 알림 설정
- [ ] 에러 컨텍스트 정보 포함

### 로깅 가이드라인
1. **로그에 포함할 정보**
   - 타임스탬프 (자동)
   - 로그 레벨
   - 요청 ID (추적용)
   - 사용자 ID (마스킹 필요시)
   - 액션/이벤트명
   - 관련 메타데이터

2. **로그에 포함하지 않을 정보**
   - 비밀번호, 토큰
   - 개인 식별 정보 (PII)
   - 신용카드 정보

## 관련 파일
- `app/api/files/[...path]/route.ts`
- 신규: `lib/logger.ts`

## 우선순위
**Priority 5 - Quality & Testing**

## Labels
`chore`, `security`, `backend`
