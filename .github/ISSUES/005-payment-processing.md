# 결제 시스템 구현

## 설명
구독 기반 결제 시스템을 구현하여 서비스 수익화를 가능하게 합니다.

## 현재 상태
- `subscriptions` 테이블 스키마 존재
- 구독 등급 정의됨 (free, basic, premium, enterprise)
- 결제 UI/API 미구현

## 구현 필요 사항

### 결제 서비스 연동
- [ ] Stripe 또는 Toss Payments 연동
- [ ] 결제 SDK 설치 및 설정
- [ ] Webhook 엔드포인트 구현

### Backend API
- [ ] `POST /api/subscriptions/checkout` - 결제 세션 생성
- [ ] `POST /api/webhooks/stripe` - Stripe 웹훅 처리
- [ ] `GET /api/subscriptions/current` - 현재 구독 조회
- [ ] `POST /api/subscriptions/cancel` - 구독 취소
- [ ] `GET /api/subscriptions/invoices` - 청구서 목록

### Database 업데이트
```sql
ALTER TABLE subscriptions ADD COLUMN stripe_customer_id VARCHAR(255);
ALTER TABLE subscriptions ADD COLUMN stripe_subscription_id VARCHAR(255);
ALTER TABLE subscriptions ADD COLUMN current_period_start TIMESTAMP;
ALTER TABLE subscriptions ADD COLUMN current_period_end TIMESTAMP;
ALTER TABLE subscriptions ADD COLUMN cancel_at_period_end BOOLEAN DEFAULT false;
```

### Frontend
- [ ] 요금제 선택 페이지 (`/pricing`)
- [ ] 결제 폼 (카드 정보 입력)
- [ ] 구독 관리 UI (설정 페이지 내)
- [ ] 결제 성공/실패 페이지
- [ ] 청구서 다운로드 기능

### 구독 등급별 기능 제한
| 기능 | Free | Basic | Premium | Enterprise |
|------|------|-------|---------|------------|
| 이력서 업로드 | 1개 | 5개 | 무제한 | 무제한 |
| AI 분석 | 1회/월 | 10회/월 | 무제한 | 무제한 |
| 모의 면접 | X | 3회/월 | 무제한 | 무제한 |
| 질문 생성 | 10개 | 50개 | 무제한 | 무제한 |

### 보안 고려사항
- [ ] 결제 정보 직접 저장하지 않음 (Stripe에서 관리)
- [ ] Webhook 서명 검증
- [ ] 결제 관련 로그 기록

## 관련 파일
- `lib/db/schema.ts` (subscriptions 테이블)
- `app/service/settings/page.tsx` (구독 관리 섹션)

## 우선순위
**Priority 2 - Payment & Subscription**

## Labels
`enhancement`, `payment`, `backend`, `frontend`, `security`
