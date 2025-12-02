# 이메일 서비스 구현

## 설명
트랜잭션 이메일, 뉴스레터, 알림 이메일 기능을 구현합니다.

## 현재 상태
- 뉴스레터 가입 UI 존재 (랜딩 페이지)
- 이메일 발송 기능 미구현
- 이메일 서비스 연동 없음

## 구현 필요 사항

### 이메일 서비스 선택
- 추천: Resend, SendGrid, 또는 AWS SES
- Cloudflare Workers 환경에서 호환성 확인 필요

### Backend API
- [ ] `POST /api/newsletter/subscribe` - 뉴스레터 구독
- [ ] `POST /api/newsletter/unsubscribe` - 구독 취소
- [ ] 이메일 발송 유틸리티 함수 (`lib/email.ts`)

### Database
```sql
CREATE TABLE newsletter_subscribers (
  id TEXT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  unsubscribed_at TIMESTAMP,
  status VARCHAR(20) DEFAULT 'active'
);
```

### 이메일 템플릿
- [ ] 환영 이메일 (회원가입 시)
- [ ] 이력서 분석 완료 알림
- [ ] 모의 면접 결과 리포트
- [ ] 구독 결제 확인
- [ ] 구독 갱신 알림
- [ ] 비밀번호 재설정 (Clerk 연동)
- [ ] 뉴스레터 템플릿

### Frontend
- [ ] 뉴스레터 구독 폼 동작 연결
- [ ] 이메일 알림 설정 UI (설정 페이지)
- [ ] 구독 성공 토스트 메시지

### 이메일 발송 트리거
1. **회원가입** → 환영 이메일
2. **이력서 분석 완료** → 분석 결과 이메일
3. **모의 면접 완료** → 면접 결과 리포트
4. **결제 완료** → 결제 확인 이메일
5. **구독 만료 7일 전** → 갱신 알림

## 관련 파일
- `app/page.tsx` (뉴스레터 섹션)
- `app/service/settings/page.tsx` (알림 설정)

## 우선순위
**Priority 2 - Payment & Email**

## Labels
`enhancement`, `email`, `backend`
