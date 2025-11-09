# 데이터베이스 마이그레이션 가이드

이전 스키마에서 새로운 Clerk 통합 스키마로 마이그레이션하는 가이드입니다.

## 🔄 주요 변경 사항

### 1. 사용자 ID 변경
- **이전**: `user_id` (자체 생성)
- **새로운**: `clerk_user_id` (Clerk에서 관리)

### 2. 테이블 구조 변경

#### Users 테이블
- `id` → `clerk_user_id`
- `name` → `first_name`, `last_name`으로 분리
- `current_role`, `target_role`, `industry` 제거 (별도 테이블로 확장 가능)
- `profile_image_url` 추가
- `subscription_tier` 추가 (구독 정보 통합)

#### Resumes 테이블
- `user_id` → `clerk_user_id`
- `file_path` → `file_url` (R2 URL)
- `feedback` → `ai_feedback` (JSON 형식)
- `version` 관리 간소화 (별도 history 테이블 제거)
- `is_active` 추가 (활성/비활성 관리)

#### Interview Questions 테이블
- `user_id` → `clerk_user_id`
- `question` → `question_text`
- `bookmarked` → `is_bookmarked`
- `practiced` 제거 (답변 테이블로 추적)
- `answer_framework` → `suggested_answer`

#### Mock Interview 관련
- `mock_interviews` → `mock_interview_sessions`
- `interview_evaluations` → `ai_evaluation` (JSON으로 통합)
- 상태 관리 개선: `in_progress`, `completed`, `paused`

### 3. 새로운 테이블

#### Subscriptions
- 결제 정보 전용 테이블
- Toss Payments, Kakao Pay, Paddle 지원
- 구독 상태 관리

#### User Notes
- 사용자 노트 기능
- 질문별 메모 가능

#### Usage Stats
- 사용 통계 집계
- 대시보드 데이터 소스

### 4. 트리거 추가
- `updated_at` 자동 갱신 트리거
- `users`, `resumes`, `subscriptions`, `user_notes` 테이블에 적용

## 📝 마이그레이션 단계

### 1단계: 백업 생성

기존 데이터베이스 백업:

```bash
# 로컬 데이터베이스 백업
npx wrangler d1 execute prepup-db --local --command="SELECT * FROM users" > backup_users.json
npx wrangler d1 execute prepup-db --local --command="SELECT * FROM resumes" > backup_resumes.json

# 프로덕션 데이터베이스 백업
npx wrangler d1 execute prepup-db --remote --command="SELECT * FROM users" > backup_users_prod.json
```

### 2단계: 새 스키마 적용

```bash
# 로컬 환경
npx wrangler d1 execute prepup-db --local --file=./schema.sql

# 프로덕션 환경 (주의!)
npx wrangler d1 execute prepup-db --remote --file=./schema.sql
```

### 3단계: 데이터 마이그레이션 스크립트

`migration.sql` 파일 생성:

```sql
-- 기존 테이블이 있다면 데이터 마이그레이션
-- 1) Users 마이그레이션 (Clerk 통합 후)
-- Clerk webhook으로 사용자 생성되므로 수동 마이그레이션은 불필요할 수 있음

-- 2) Resumes 마이그레이션
INSERT INTO resumes (
  resume_id, 
  clerk_user_id, 
  title, 
  content, 
  version, 
  is_active,
  file_url,
  score,
  created_at,
  updated_at
)
SELECT 
  id AS resume_id,
  user_id AS clerk_user_id,  -- Clerk ID로 매핑 필요
  title,
  '' AS content,
  version,
  1 AS is_active,
  file_path AS file_url,
  ats_score AS score,
  datetime(created_at / 1000, 'unixepoch') AS created_at,
  datetime(updated_at / 1000, 'unixepoch') AS updated_at
FROM old_resumes;

-- 3) Interview Questions 마이그레이션
INSERT INTO interview_questions (
  question_id,
  resume_id,
  clerk_user_id,
  question_text,
  category,
  difficulty,
  tips,
  suggested_answer,
  is_bookmarked,
  created_at
)
SELECT
  id AS question_id,
  '' AS resume_id,  -- 매핑 필요
  user_id AS clerk_user_id,
  question AS question_text,
  category,
  difficulty,
  tips,
  answer_framework AS suggested_answer,
  bookmarked AS is_bookmarked,
  datetime(created_at / 1000, 'unixepoch') AS created_at
FROM old_interview_questions;
```

### 4단계: Clerk Webhook 설정

사용자 생성/업데이트 시 자동으로 DB에 저장:

```typescript
// app/api/webhooks/clerk/route.ts
import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { getDB, generateId, getCurrentTimestamp } from '@/lib/db';

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
  
  if (!WEBHOOK_SECRET) {
    throw new Error('Please add CLERK_WEBHOOK_SECRET to .env');
  }

  const headerPayload = headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error: Missing svix headers', { status: 400 });
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);

  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Error: Verification failed', { status: 400 });
  }

  const db = getDB();
  const eventType = evt.type;

  // 사용자 생성
  if (eventType === 'user.created') {
    const { id, email_addresses, first_name, last_name, image_url } = evt.data;
    
    await db.prepare(`
      INSERT INTO users (
        clerk_user_id, email, first_name, last_name, 
        profile_image_url, subscription_tier, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, 'free', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).bind(
      id,
      email_addresses[0]?.email_address,
      first_name,
      last_name,
      image_url
    ).run();

    // 기본 구독 생성
    await db.prepare(`
      INSERT INTO subscriptions (
        subscription_id, clerk_user_id, tier, start_date,
        auto_renew, status, payment_provider, created_at, updated_at
      ) VALUES (?, ?, 'free', date('now'), 1, 'active', 'toss_payments', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).bind(generateId(), id).run();

    // 사용 통계 초기화
    await db.prepare(`
      INSERT INTO usage_stats (
        stat_id, clerk_user_id, resumes_created, interviews_completed,
        total_mock_interview_minutes, last_activity
      ) VALUES (?, ?, 0, 0, 0, CURRENT_TIMESTAMP)
    `).bind(generateId(), id).run();
  }

  // 사용자 업데이트
  if (eventType === 'user.updated') {
    const { id, email_addresses, first_name, last_name, image_url } = evt.data;
    
    await db.prepare(`
      UPDATE users 
      SET email = ?, first_name = ?, last_name = ?, profile_image_url = ?
      WHERE clerk_user_id = ?
    `).bind(
      email_addresses[0]?.email_address,
      first_name,
      last_name,
      image_url,
      id
    ).run();
  }

  // 사용자 삭제
  if (eventType === 'user.deleted') {
    const { id } = evt.data;
    
    // CASCADE로 자동 삭제되지만 명시적으로 처리 가능
    await db.prepare('DELETE FROM users WHERE clerk_user_id = ?').bind(id).run();
  }

  return new Response('Webhook processed', { status: 200 });
}
```

## 🔧 환경 변수 추가

`.dev.vars` 파일에 추가:

```env
CLERK_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

## ✅ 마이그레이션 체크리스트

- [ ] 기존 데이터 백업 완료
- [ ] 새 스키마 테스트 완료
- [ ] Clerk Webhook 설정 완료
- [ ] Webhook Secret 환경 변수 설정
- [ ] 로컬 환경에서 테스트
- [ ] 프로덕션 배포 전 스테이징 테스트
- [ ] 데이터 마이그레이션 스크립트 실행
- [ ] 사용자 인증 플로우 테스트
- [ ] 구독 기능 테스트
- [ ] R2 파일 업로드/다운로드 테스트

## 🚨 주의사항

1. **프로덕션 마이그레이션 전 반드시 백업**
2. **Clerk 통합 완료 후 마이그레이션 실행**
3. **기존 user_id를 clerk_user_id로 매핑하는 전환 테이블 필요할 수 있음**
4. **트랜잭션 사용으로 원자성 보장**
5. **롤백 계획 준비**

## 📚 참고 문서

- [Clerk Webhooks](https://clerk.com/docs/integration/webhooks)
- [Cloudflare D1 Best Practices](https://developers.cloudflare.com/d1/learning/best-practices/)
- [D1 Migrations](https://developers.cloudflare.com/d1/learning/migrations/)

