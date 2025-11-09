# 데이터베이스 스키마 문서

PrepUp 데이터베이스의 전체 스키마와 각 테이블의 상세 설명입니다.

## 📋 목차
- [개요](#개요)
- [ERD (관계도)](#erd-관계도)
- [테이블 상세](#테이블-상세)
- [인덱스 전략](#인덱스-전략)
- [트리거](#트리거)
- [제약 조건](#제약-조건)

## 개요

PrepUp은 Cloudflare D1 (SQLite)을 사용하며, Clerk 인증과 통합되어 있습니다.

### 주요 특징
- ✅ Foreign Key 활성화 (`PRAGMA foreign_keys = ON`)
- ✅ 자동 타임스탬프 관리 (트리거)
- ✅ CHECK 제약 조건으로 데이터 무결성 보장
- ✅ 효율적인 인덱싱 전략

### 데이터베이스 정보
- **엔진**: SQLite (Cloudflare D1)
- **인증**: Clerk (clerk_user_id 기반)
- **타임존**: UTC
- **날짜 형식**: ISO 8601 (DATETIME)

## ERD (관계도)

```
┌─────────────────┐
│     users       │
│  (Clerk 동기화)  │
└────────┬────────┘
         │
         ├─────────────────────────────────────┐
         │                                     │
         ▼                                     ▼
┌─────────────────┐                  ┌─────────────────┐
│    resumes      │                  │  subscriptions  │
│  (이력서 관리)    │                  │   (구독 관리)    │
└────────┬────────┘                  └─────────────────┘
         │
         ├──────────────────┐
         ▼                  ▼
┌─────────────────┐  ┌─────────────────────┐
│interview_       │  │mock_interview_      │
│questions        │  │sessions             │
└────────┬────────┘  └──────────┬──────────┘
         │                      │
         ▼                      ▼
┌─────────────────┐  ┌─────────────────────┐
│  user_notes     │  │interview_answers    │
└─────────────────┘  └─────────────────────┘

         ┌─────────────────┐
         │  usage_stats    │
         │   (집계 데이터)   │
         └─────────────────┘
```

## 테이블 상세

### 1. `users` - 사용자 정보

Clerk와 동기화되는 사용자 정보 테이블입니다.

```sql
CREATE TABLE users (
  clerk_user_id         TEXT PRIMARY KEY,
  email                 TEXT UNIQUE NOT NULL,
  first_name            TEXT,
  last_name             TEXT,
  profile_image_url     TEXT,
  language_preference   TEXT NOT NULL DEFAULT 'en',
  subscription_tier     TEXT CHECK (subscription_tier IN ('free','premium','pro')) DEFAULT 'free',
  subscription_end_date DATE,
  created_at            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

#### 컬럼 설명
| 컬럼 | 타입 | 설명 | 기본값 |
|------|------|------|--------|
| clerk_user_id | TEXT | Clerk 사용자 ID (PK) | - |
| email | TEXT | 이메일 주소 (Unique) | - |
| first_name | TEXT | 이름 | NULL |
| last_name | TEXT | 성 | NULL |
| profile_image_url | TEXT | 프로필 이미지 URL | NULL |
| language_preference | TEXT | 언어 설정 (en, ko, etc.) | 'en' |
| subscription_tier | TEXT | 구독 등급 | 'free' |
| subscription_end_date | DATE | 구독 만료일 | NULL |
| created_at | DATETIME | 생성일시 | CURRENT_TIMESTAMP |
| updated_at | DATETIME | 수정일시 (자동) | CURRENT_TIMESTAMP |

#### 인덱스
- `idx_users_email` - 이메일 검색 최적화

#### 관계
- `resumes` (1:N)
- `interview_questions` (1:N)
- `mock_interview_sessions` (1:N)
- `subscriptions` (1:1)
- `user_notes` (1:N)
- `usage_stats` (1:1)

---

### 2. `resumes` - 이력서 관리

사용자의 이력서 정보를 저장합니다.

```sql
CREATE TABLE resumes (
  resume_id      TEXT PRIMARY KEY,
  clerk_user_id  TEXT NOT NULL,
  title          TEXT NOT NULL,
  content        TEXT,
  version        INTEGER NOT NULL DEFAULT 1,
  is_active      INTEGER NOT NULL DEFAULT 1,
  file_url       TEXT,
  ai_feedback    TEXT,
  score          INTEGER CHECK (score BETWEEN 0 AND 100),
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (clerk_user_id) REFERENCES users(clerk_user_id) ON DELETE CASCADE
);
```

#### 컬럼 설명
| 컬럼 | 타입 | 설명 | 기본값 |
|------|------|------|--------|
| resume_id | TEXT | 이력서 ID (PK) | - |
| clerk_user_id | TEXT | 사용자 ID (FK) | - |
| title | TEXT | 이력서 제목 | - |
| content | TEXT | 이력서 내용 (원문) | NULL |
| version | INTEGER | 버전 번호 | 1 |
| is_active | INTEGER | 활성화 여부 (0/1) | 1 |
| file_url | TEXT | R2 파일 URL | NULL |
| ai_feedback | TEXT | AI 피드백 (JSON) | NULL |
| score | INTEGER | ATS 점수 (0-100) | NULL |
| created_at | DATETIME | 생성일시 | CURRENT_TIMESTAMP |
| updated_at | DATETIME | 수정일시 (자동) | CURRENT_TIMESTAMP |

#### AI Feedback JSON 구조
```typescript
{
  "summary": "전반적인 평가",
  "strengths": ["강점 1", "강점 2"],
  "improvements": ["개선사항 1", "개선사항 2"],
  "suggestions": ["제안 1", "제안 2"],
  "keywords": ["키워드 1", "키워드 2"]
}
```

#### 인덱스
- `idx_resumes_user` - 사용자별 이력서 조회
- `idx_resumes_active` - 활성 이력서 필터링

---

### 3. `interview_questions` - 인터뷰 질문

이력서 기반으로 생성된 인터뷰 질문들입니다.

```sql
CREATE TABLE interview_questions (
  question_id     TEXT PRIMARY KEY,
  resume_id       TEXT NOT NULL,
  clerk_user_id   TEXT NOT NULL,
  question_text   TEXT NOT NULL,
  category        TEXT CHECK (category IN ('behavioral','technical','situational')),
  difficulty      TEXT CHECK (difficulty IN ('easy','medium','hard')),
  suggested_answer  TEXT,
  tips            TEXT,
  is_bookmarked   INTEGER NOT NULL DEFAULT 0,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (resume_id) REFERENCES resumes(resume_id) ON DELETE CASCADE,
  FOREIGN KEY (clerk_user_id) REFERENCES users(clerk_user_id) ON DELETE CASCADE
);
```

#### 카테고리
- **behavioral**: 행동 면접 (STAR 방식)
- **technical**: 기술 면접 (코딩, 시스템 설계)
- **situational**: 상황 면접 (문제 해결)

#### 난이도
- **easy**: 쉬움 (기본 개념)
- **medium**: 보통 (실무 경험)
- **hard**: 어려움 (깊은 이해 필요)

#### 인덱스
- `idx_q_user` - 사용자별 질문 조회
- `idx_q_resume` - 이력서별 질문 조회
- `idx_q_cat_diff` - 카테고리/난이도 필터링

---

### 4. `mock_interview_sessions` - 모의 인터뷰 세션

실시간 모의 인터뷰 세션 정보입니다.

```sql
CREATE TABLE mock_interview_sessions (
  session_id      TEXT PRIMARY KEY,
  clerk_user_id   TEXT NOT NULL,
  resume_id       TEXT,
  start_time      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  end_time        DATETIME,
  duration_seconds INTEGER,
  questions_count INTEGER,
  recording_url   TEXT,
  ai_evaluation   TEXT,
  overall_score   INTEGER CHECK (overall_score BETWEEN 0 AND 100),
  status          TEXT CHECK (status IN ('in_progress','completed','paused')) NOT NULL DEFAULT 'in_progress',
  FOREIGN KEY (clerk_user_id) REFERENCES users(clerk_user_id) ON DELETE CASCADE,
  FOREIGN KEY (resume_id) REFERENCES resumes(resume_id) ON DELETE SET NULL
);
```

#### 상태 (status)
- **in_progress**: 진행 중
- **completed**: 완료
- **paused**: 일시정지

#### AI Evaluation JSON 구조
```typescript
{
  "communication_score": 85,
  "technical_score": 90,
  "problem_solving_score": 88,
  "confidence_score": 82,
  "overall_feedback": "전체 평가",
  "strengths": ["강점 1", "강점 2"],
  "areas_for_improvement": ["개선점 1", "개선점 2"]
}
```

#### 인덱스
- `idx_sessions_user` - 사용자별 세션 조회
- `idx_sessions_status` - 상태별 필터링
- `idx_sessions_start` - 날짜별 정렬

---

### 5. `interview_answers` - 인터뷰 답변

각 질문에 대한 사용자의 답변 기록입니다.

```sql
CREATE TABLE interview_answers (
  answer_id       TEXT PRIMARY KEY,
  session_id      TEXT NOT NULL,
  question_id     TEXT NOT NULL,
  user_answer     TEXT,
  audio_url       TEXT,
  duration_seconds INTEGER,
  ai_feedback     TEXT,
  score           INTEGER CHECK (score BETWEEN 0 AND 100),
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES mock_interview_sessions(session_id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES interview_questions(question_id) ON DELETE CASCADE
);
```

#### 인덱스
- `idx_answers_session` - 세션별 답변 조회
- `idx_answers_question` - 질문별 답변 조회

---

### 6. `subscriptions` - 구독 관리

사용자의 구독 및 결제 정보입니다.

```sql
CREATE TABLE subscriptions (
  subscription_id   TEXT PRIMARY KEY,
  clerk_user_id     TEXT NOT NULL UNIQUE,
  tier              TEXT CHECK (tier IN ('free','premium','pro')) NOT NULL,
  start_date        DATE NOT NULL,
  end_date          DATE,
  auto_renew        INTEGER NOT NULL DEFAULT 1,
  status            TEXT CHECK (status IN ('active','cancelled','expired')) NOT NULL DEFAULT 'active',
  payment_provider  TEXT CHECK (payment_provider IN ('toss_payments','kakao_pay','paddle')) DEFAULT 'toss_payments',
  transaction_id    TEXT,
  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (clerk_user_id) REFERENCES users(clerk_user_id) ON DELETE CASCADE
);
```

#### 구독 등급
| 등급 | 월 가격 | 특징 |
|------|---------|------|
| free | $0 | 1 이력서, 20 질문, 1 모의 인터뷰 |
| premium | $29 | 무제한 이력서/질문, 20 모의 인터뷰 |
| pro | Custom | Enterprise 기능 |

#### 결제 제공자
- **toss_payments**: 토스페이먼츠 (한국)
- **kakao_pay**: 카카오페이 (한국)
- **paddle**: Paddle (글로벌)

#### 인덱스
- `idx_subscriptions_user` - 사용자별 구독 조회
- `idx_subscriptions_status` - 상태별 필터링

---

### 7. `user_notes` - 사용자 노트

사용자가 작성한 메모 및 노트입니다.

```sql
CREATE TABLE user_notes (
  note_id        TEXT PRIMARY KEY,
  clerk_user_id  TEXT NOT NULL,
  question_id    TEXT,
  note_text      TEXT NOT NULL,
  is_public      INTEGER NOT NULL DEFAULT 0,
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (clerk_user_id) REFERENCES users(clerk_user_id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES interview_questions(question_id) ON DELETE SET NULL
);
```

#### 인덱스
- `idx_notes_user` - 사용자별 노트 조회
- `idx_notes_question` - 질문별 노트 조회

---

### 8. `usage_stats` - 사용 통계

사용자의 활동 통계를 집계합니다.

```sql
CREATE TABLE usage_stats (
  stat_id                     TEXT PRIMARY KEY,
  clerk_user_id               TEXT NOT NULL,
  resumes_created             INTEGER NOT NULL DEFAULT 0,
  interviews_completed        INTEGER NOT NULL DEFAULT 0,
  total_mock_interview_minutes INTEGER NOT NULL DEFAULT 0,
  average_score               REAL,
  last_activity               DATETIME,
  FOREIGN KEY (clerk_user_id) REFERENCES users(clerk_user_id) ON DELETE CASCADE
);
```

#### 인덱스
- `idx_usage_user_unique` (UNIQUE) - 사용자당 하나의 통계

---

## 인덱스 전략

### 인덱스 목록

| 인덱스 이름 | 테이블 | 컬럼 | 용도 |
|-------------|--------|------|------|
| idx_users_email | users | email | 이메일 검색 |
| idx_resumes_user | resumes | clerk_user_id | 사용자 이력서 조회 |
| idx_resumes_active | resumes | is_active | 활성 이력서 필터 |
| idx_q_user | interview_questions | clerk_user_id | 사용자 질문 조회 |
| idx_q_resume | interview_questions | resume_id | 이력서별 질문 |
| idx_q_cat_diff | interview_questions | category, difficulty | 카테고리/난이도 필터 |
| idx_sessions_user | mock_interview_sessions | clerk_user_id | 사용자 세션 조회 |
| idx_sessions_status | mock_interview_sessions | status | 상태별 필터 |
| idx_sessions_start | mock_interview_sessions | start_time | 날짜 정렬 |
| idx_answers_session | interview_answers | session_id | 세션 답변 조회 |
| idx_answers_question | interview_answers | question_id | 질문 답변 조회 |
| idx_subscriptions_user | subscriptions | clerk_user_id | 구독 조회 |
| idx_subscriptions_status | subscriptions | status | 상태 필터 |
| idx_notes_user | user_notes | clerk_user_id | 사용자 노트 조회 |
| idx_notes_question | user_notes | question_id | 질문 노트 조회 |
| idx_usage_user_unique | usage_stats | clerk_user_id | 통계 조회 (UNIQUE) |

### 인덱스 사용 가이드

```sql
-- ✅ 좋은 예: 인덱스 사용
SELECT * FROM resumes WHERE clerk_user_id = ? AND is_active = 1;

-- ❌ 나쁜 예: 인덱스 미사용
SELECT * FROM resumes WHERE title LIKE '%engineer%';

-- ✅ 좋은 예: 복합 인덱스 활용
SELECT * FROM interview_questions 
WHERE category = 'technical' AND difficulty = 'hard';
```

---

## 트리거

자동 타임스탬프 관리를 위한 트리거입니다.

### updated_at 트리거

```sql
-- users 테이블
CREATE TRIGGER trg_users_updated
AFTER UPDATE ON users
FOR EACH ROW BEGIN
  UPDATE users SET updated_at = CURRENT_TIMESTAMP 
  WHERE clerk_user_id = NEW.clerk_user_id;
END;

-- resumes 테이블
CREATE TRIGGER trg_resumes_updated
AFTER UPDATE ON resumes
FOR EACH ROW BEGIN
  UPDATE resumes SET updated_at = CURRENT_TIMESTAMP 
  WHERE resume_id = NEW.resume_id;
END;

-- subscriptions 테이블
CREATE TRIGGER trg_subscriptions_updated
AFTER UPDATE ON subscriptions
FOR EACH ROW BEGIN
  UPDATE subscriptions SET updated_at = CURRENT_TIMESTAMP 
  WHERE subscription_id = NEW.subscription_id;
END;

-- user_notes 테이블
CREATE TRIGGER trg_notes_updated
AFTER UPDATE ON user_notes
FOR EACH ROW BEGIN
  UPDATE user_notes SET updated_at = CURRENT_TIMESTAMP 
  WHERE note_id = NEW.note_id;
END;
```

---

## 제약 조건

### CHECK 제약 조건

#### users 테이블
```sql
CHECK (subscription_tier IN ('free','premium','pro'))
```

#### resumes 테이블
```sql
CHECK (score BETWEEN 0 AND 100)
```

#### interview_questions 테이블
```sql
CHECK (category IN ('behavioral','technical','situational'))
CHECK (difficulty IN ('easy','medium','hard'))
```

#### mock_interview_sessions 테이블
```sql
CHECK (overall_score BETWEEN 0 AND 100)
CHECK (status IN ('in_progress','completed','paused'))
```

#### subscriptions 테이블
```sql
CHECK (tier IN ('free','premium','pro'))
CHECK (status IN ('active','cancelled','expired'))
CHECK (payment_provider IN ('toss_payments','kakao_pay','paddle'))
```

### FOREIGN KEY 제약 조건

모든 외래 키는 `ON DELETE CASCADE` 또는 `ON DELETE SET NULL`로 설정되어 있습니다.

```sql
-- CASCADE: 부모 삭제 시 자식도 삭제
FOREIGN KEY (clerk_user_id) REFERENCES users(clerk_user_id) ON DELETE CASCADE

-- SET NULL: 부모 삭제 시 자식은 NULL로 설정
FOREIGN KEY (resume_id) REFERENCES resumes(resume_id) ON DELETE SET NULL
```

---

## 관련 문서

- [데이터베이스 빠른 시작](./quick-start.md)
- [데이터베이스 설정 가이드](./setup.md)
- [쿼리 예제](./queries.md)
- [마이그레이션 가이드](./migration.md)

---

**마지막 업데이트**: 2025년 11월 9일

