# 자주 사용하는 쿼리 예제

PrepUp에서 자주 사용하는 데이터베이스 쿼리 모음입니다.

## 📋 목차
- [사용자 관련 쿼리](#사용자-관련-쿼리)
- [이력서 관련 쿼리](#이력서-관련-쿼리)
- [질문 관련 쿼리](#질문-관련-쿼리)
- [모의 인터뷰 쿼리](#모의-인터뷰-쿼리)
- [구독 관련 쿼리](#구독-관련-쿼리)
- [통계 쿼리](#통계-쿼리)
- [복잡한 쿼리](#복잡한-쿼리)

## 사용자 관련 쿼리

### 사용자 생성

```typescript
import { execute, generateId } from '@/lib/db';

const userId = 'user_clerk_123'; // Clerk에서 제공
await execute(
  `INSERT INTO users (
    clerk_user_id, email, first_name, last_name, 
    language_preference, subscription_tier
  ) VALUES (?, ?, ?, ?, ?, ?)`,
  userId, 'user@example.com', 'John', 'Doe', 'en', 'free'
);
```

### 사용자 정보 조회

```typescript
import { queryOne } from '@/lib/db';
import type { User } from '@/types/database';

const user = await queryOne<User>(
  'SELECT * FROM users WHERE clerk_user_id = ?',
  userId
);
```

### 사용자 정보 업데이트

```typescript
await execute(
  `UPDATE users 
   SET first_name = ?, last_name = ?, language_preference = ?
   WHERE clerk_user_id = ?`,
  'John', 'Smith', 'ko', userId
);
```

### 사용자 삭제 (CASCADE)

```typescript
// users 삭제 시 관련 모든 데이터도 자동 삭제됨
await execute(
  'DELETE FROM users WHERE clerk_user_id = ?',
  userId
);
```

---

## 이력서 관련 쿼리

### 이력서 생성

```typescript
import { execute, generateId } from '@/lib/db';

const resumeId = generateId();
await execute(
  `INSERT INTO resumes (
    resume_id, clerk_user_id, title, file_url, version, is_active
  ) VALUES (?, ?, ?, ?, 1, 1)`,
  resumeId, userId, 'Senior Developer Resume', 'resumes/user123/resume.pdf'
);
```

### 활성 이력서 목록 조회

```typescript
import { queryAll } from '@/lib/db';
import type { Resume } from '@/types/database';

const resumes = await queryAll<Resume>(
  `SELECT * FROM resumes 
   WHERE clerk_user_id = ? AND is_active = 1 
   ORDER BY created_at DESC`,
  userId
);
```

### 이력서 상세 조회 (AI 피드백 포함)

```typescript
const resume = await queryOne<Resume>(
  `SELECT * FROM resumes WHERE resume_id = ?`,
  resumeId
);

// AI 피드백 파싱
if (resume?.ai_feedback) {
  const feedback = JSON.parse(resume.ai_feedback);
  console.log(feedback.summary);
  console.log(feedback.strengths);
}
```

### 이력서 AI 피드백 업데이트

```typescript
const feedback = {
  summary: "Overall good resume",
  strengths: ["Strong technical skills", "Clear formatting"],
  improvements: ["Add more metrics", "Update skills section"],
  suggestions: ["Include certifications", "Add portfolio links"],
  keywords: ["Python", "React", "AWS"]
};

await execute(
  `UPDATE resumes 
   SET ai_feedback = ?, score = ?, updated_at = CURRENT_TIMESTAMP
   WHERE resume_id = ?`,
  JSON.stringify(feedback), 92, resumeId
);
```

### 이력서 비활성화

```typescript
await execute(
  'UPDATE resumes SET is_active = 0 WHERE resume_id = ?',
  resumeId
);
```

### 최고 점수 이력서 조회

```typescript
const topResume = await queryOne<Resume>(
  `SELECT * FROM resumes 
   WHERE clerk_user_id = ? AND is_active = 1 
   ORDER BY score DESC LIMIT 1`,
  userId
);
```

---

## 질문 관련 쿼리

### 이력서 기반 질문 생성

```typescript
const questionId = generateId();
await execute(
  `INSERT INTO interview_questions (
    question_id, resume_id, clerk_user_id, question_text, 
    category, difficulty, tips, suggested_answer
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  questionId,
  resumeId,
  userId,
  'Describe your experience with microservices',
  'technical',
  'medium',
  'Focus on specific projects and technologies',
  'Use STAR method to describe your experience...'
);
```

### 카테고리별 질문 조회

```typescript
import type { InterviewQuestion } from '@/types/database';

const technicalQuestions = await queryAll<InterviewQuestion>(
  `SELECT * FROM interview_questions 
   WHERE clerk_user_id = ? AND category = ?
   ORDER BY difficulty, created_at DESC`,
  userId, 'technical'
);
```

### 난이도별 질문 조회

```typescript
const mediumQuestions = await queryAll<InterviewQuestion>(
  `SELECT * FROM interview_questions 
   WHERE clerk_user_id = ? AND difficulty = ?`,
  userId, 'medium'
);
```

### 북마크된 질문 조회

```typescript
const bookmarkedQuestions = await queryAll<InterviewQuestion>(
  `SELECT * FROM interview_questions 
   WHERE clerk_user_id = ? AND is_bookmarked = 1
   ORDER BY created_at DESC`,
  userId
);
```

### 질문 북마크 토글

```typescript
await execute(
  `UPDATE interview_questions 
   SET is_bookmarked = CASE 
     WHEN is_bookmarked = 1 THEN 0 
     ELSE 1 
   END
   WHERE question_id = ?`,
  questionId
);
```

### 이력서별 질문 통계

```typescript
interface QuestionStats {
  resume_id: string;
  total_questions: number;
  behavioral_count: number;
  technical_count: number;
  situational_count: number;
  avg_difficulty: string;
}

const stats = await queryOne<QuestionStats>(
  `SELECT 
    resume_id,
    COUNT(*) as total_questions,
    SUM(CASE WHEN category = 'behavioral' THEN 1 ELSE 0 END) as behavioral_count,
    SUM(CASE WHEN category = 'technical' THEN 1 ELSE 0 END) as technical_count,
    SUM(CASE WHEN category = 'situational' THEN 1 ELSE 0 END) as situational_count,
    CASE 
      WHEN AVG(CASE difficulty WHEN 'easy' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END) < 1.5 THEN 'easy'
      WHEN AVG(CASE difficulty WHEN 'easy' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END) < 2.5 THEN 'medium'
      ELSE 'hard'
    END as avg_difficulty
   FROM interview_questions
   WHERE resume_id = ?
   GROUP BY resume_id`,
  resumeId
);
```

---

## 모의 인터뷰 쿼리

### 세션 시작

```typescript
const sessionId = generateId();
await execute(
  `INSERT INTO mock_interview_sessions (
    session_id, clerk_user_id, resume_id, status
  ) VALUES (?, ?, ?, 'in_progress')`,
  sessionId, userId, resumeId
);
```

### 답변 저장

```typescript
const answerId = generateId();
await execute(
  `INSERT INTO interview_answers (
    answer_id, session_id, question_id, user_answer, 
    audio_url, duration_seconds, score
  ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
  answerId, sessionId, questionId, 
  'My answer text...', 
  'recordings/answer123.mp3', 
  120, 
  85
);
```

### 세션 완료

```typescript
const evaluation = {
  communication_score: 85,
  technical_score: 90,
  problem_solving_score: 88,
  confidence_score: 82,
  overall_feedback: "Great performance overall",
  strengths: ["Clear communication", "Strong technical knowledge"],
  areas_for_improvement: ["Provide more specific examples"]
};

await execute(
  `UPDATE mock_interview_sessions 
   SET end_time = CURRENT_TIMESTAMP,
       duration_seconds = ?,
       questions_count = ?,
       ai_evaluation = ?,
       overall_score = ?,
       status = 'completed'
   WHERE session_id = ?`,
  1800, 10, JSON.stringify(evaluation), 87, sessionId
);
```

### 최근 세션 목록

```typescript
import type { MockInterviewSession } from '@/types/database';

const recentSessions = await queryAll<MockInterviewSession>(
  `SELECT * FROM mock_interview_sessions 
   WHERE clerk_user_id = ? 
   ORDER BY start_time DESC 
   LIMIT 10`,
  userId
);
```

### 세션별 답변 조회

```typescript
import type { InterviewAnswer } from '@/types/database';

const answers = await queryAll<InterviewAnswer>(
  `SELECT ia.*, iq.question_text, iq.category
   FROM interview_answers ia
   JOIN interview_questions iq ON ia.question_id = iq.question_id
   WHERE ia.session_id = ?
   ORDER BY ia.created_at`,
  sessionId
);
```

### 평균 점수 조회

```typescript
interface AverageScore {
  avg_score: number;
  total_sessions: number;
}

const avgScore = await queryOne<AverageScore>(
  `SELECT 
    AVG(overall_score) as avg_score,
    COUNT(*) as total_sessions
   FROM mock_interview_sessions
   WHERE clerk_user_id = ? AND status = 'completed'`,
  userId
);
```

### 월별 인터뷰 통계

```typescript
interface MonthlyStats {
  month: string;
  interview_count: number;
  avg_score: number;
}

const monthlyStats = await queryAll<MonthlyStats>(
  `SELECT 
    strftime('%Y-%m', start_time) as month,
    COUNT(*) as interview_count,
    AVG(overall_score) as avg_score
   FROM mock_interview_sessions
   WHERE clerk_user_id = ? AND status = 'completed'
   GROUP BY strftime('%Y-%m', start_time)
   ORDER BY month DESC
   LIMIT 6`,
  userId
);
```

---

## 구독 관련 쿼리

### 구독 생성

```typescript
const subscriptionId = generateId();
await execute(
  `INSERT INTO subscriptions (
    subscription_id, clerk_user_id, tier, start_date, 
    auto_renew, status, payment_provider
  ) VALUES (?, ?, ?, date('now'), 1, 'active', ?)`,
  subscriptionId, userId, 'premium', 'toss_payments'
);
```

### 구독 정보 조회

```typescript
import type { Subscription } from '@/types/database';

const subscription = await queryOne<Subscription>(
  `SELECT * FROM subscriptions WHERE clerk_user_id = ?`,
  userId
);
```

### 구독 업그레이드

```typescript
await execute(
  `UPDATE subscriptions 
   SET tier = ?, payment_provider = ?, transaction_id = ?
   WHERE clerk_user_id = ?`,
  'pro', 'toss_payments', 'txn_123456', userId
);
```

### 구독 취소

```typescript
await execute(
  `UPDATE subscriptions 
   SET status = 'cancelled', auto_renew = 0
   WHERE clerk_user_id = ?`,
  userId
);
```

### 만료된 구독 조회

```typescript
const expiredSubscriptions = await queryAll<Subscription>(
  `SELECT * FROM subscriptions 
   WHERE status = 'active' 
   AND end_date < date('now')`
);
```

---

## 통계 쿼리

### 사용 통계 업데이트

```typescript
await execute(
  `INSERT INTO usage_stats (
    stat_id, clerk_user_id, resumes_created, 
    interviews_completed, total_mock_interview_minutes, 
    average_score, last_activity
  ) VALUES (?, ?, 1, 0, 0, NULL, CURRENT_TIMESTAMP)
  ON CONFLICT(clerk_user_id) DO UPDATE SET
    resumes_created = resumes_created + 1,
    last_activity = CURRENT_TIMESTAMP`,
  generateId(), userId
);
```

### 모의 인터뷰 통계 증가

```typescript
await execute(
  `UPDATE usage_stats 
   SET interviews_completed = interviews_completed + 1,
       total_mock_interview_minutes = total_mock_interview_minutes + ?,
       average_score = (
         SELECT AVG(overall_score) 
         FROM mock_interview_sessions 
         WHERE clerk_user_id = ? AND status = 'completed'
       ),
       last_activity = CURRENT_TIMESTAMP
   WHERE clerk_user_id = ?`,
  30, userId, userId
);
```

### 사용자 대시보드 통계

```typescript
interface DashboardStats {
  resumes_created: number;
  interviews_completed: number;
  total_minutes: number;
  average_score: number;
  active_resumes: number;
  bookmarked_questions: number;
  this_week_interviews: number;
}

const stats = await queryOne<DashboardStats>(
  `SELECT 
    us.resumes_created,
    us.interviews_completed,
    us.total_mock_interview_minutes as total_minutes,
    us.average_score,
    (SELECT COUNT(*) FROM resumes WHERE clerk_user_id = ? AND is_active = 1) as active_resumes,
    (SELECT COUNT(*) FROM interview_questions WHERE clerk_user_id = ? AND is_bookmarked = 1) as bookmarked_questions,
    (SELECT COUNT(*) FROM mock_interview_sessions 
     WHERE clerk_user_id = ? 
     AND start_time >= date('now', '-7 days')
     AND status = 'completed') as this_week_interviews
   FROM usage_stats us
   WHERE us.clerk_user_id = ?`,
  userId, userId, userId, userId
);
```

---

## 복잡한 쿼리

### 이력서별 종합 리포트

```typescript
interface ResumeReport {
  resume_id: string;
  title: string;
  score: number;
  total_questions: number;
  completed_interviews: number;
  avg_interview_score: number;
  last_used: string;
}

const report = await queryOne<ResumeReport>(
  `SELECT 
    r.resume_id,
    r.title,
    r.score,
    COUNT(DISTINCT iq.question_id) as total_questions,
    COUNT(DISTINCT mis.session_id) as completed_interviews,
    AVG(mis.overall_score) as avg_interview_score,
    MAX(mis.start_time) as last_used
   FROM resumes r
   LEFT JOIN interview_questions iq ON r.resume_id = iq.resume_id
   LEFT JOIN mock_interview_sessions mis ON r.resume_id = mis.resume_id 
     AND mis.status = 'completed'
   WHERE r.resume_id = ?
   GROUP BY r.resume_id`,
  resumeId
);
```

### 사용자 진행률 추적

```typescript
interface ProgressTracking {
  week: number;
  resumes_created: number;
  questions_practiced: number;
  interviews_completed: number;
  avg_score: number;
}

const weeklyProgress = await queryAll<ProgressTracking>(
  `SELECT 
    strftime('%W', start_time) as week,
    (SELECT COUNT(*) FROM resumes WHERE clerk_user_id = ? 
     AND strftime('%W', created_at) = strftime('%W', mis.start_time)) as resumes_created,
    (SELECT COUNT(*) FROM interview_answers ia
     JOIN mock_interview_sessions mis2 ON ia.session_id = mis2.session_id
     WHERE mis2.clerk_user_id = ?
     AND strftime('%W', ia.created_at) = strftime('%W', mis.start_time)) as questions_practiced,
    COUNT(DISTINCT mis.session_id) as interviews_completed,
    AVG(mis.overall_score) as avg_score
   FROM mock_interview_sessions mis
   WHERE mis.clerk_user_id = ? 
   AND mis.status = 'completed'
   AND mis.start_time >= date('now', '-12 weeks')
   GROUP BY strftime('%W', start_time)
   ORDER BY week DESC`,
  userId, userId, userId
);
```

### 트렌드 분석

```typescript
interface TrendAnalysis {
  category: string;
  question_count: number;
  avg_score: number;
  improvement_rate: number;
}

const trends = await queryAll<TrendAnalysis>(
  `SELECT 
    iq.category,
    COUNT(DISTINCT iq.question_id) as question_count,
    AVG(ia.score) as avg_score,
    (AVG(CASE WHEN ia.created_at >= date('now', '-30 days') THEN ia.score END) - 
     AVG(CASE WHEN ia.created_at < date('now', '-30 days') THEN ia.score END)) as improvement_rate
   FROM interview_questions iq
   JOIN interview_answers ia ON iq.question_id = ia.question_id
   JOIN mock_interview_sessions mis ON ia.session_id = mis.session_id
   WHERE mis.clerk_user_id = ?
   AND mis.status = 'completed'
   GROUP BY iq.category
   ORDER BY avg_score DESC`,
  userId
);
```

---

## 트랜잭션 사용

여러 쿼리를 원자적으로 실행하려면 `transaction` 헬퍼를 사용하세요:

```typescript
import { transaction, generateId } from '@/lib/db';

const resumeId = generateId();
const sessionId = generateId();
const statId = generateId();

await transaction([
  {
    query: `INSERT INTO resumes (resume_id, clerk_user_id, title) VALUES (?, ?, ?)`,
    params: [resumeId, userId, 'My Resume']
  },
  {
    query: `INSERT INTO mock_interview_sessions (session_id, clerk_user_id, resume_id) 
            VALUES (?, ?, ?)`,
    params: [sessionId, userId, resumeId]
  },
  {
    query: `UPDATE usage_stats SET resumes_created = resumes_created + 1 
            WHERE clerk_user_id = ?`,
    params: [userId]
  }
]);
```

---

## 성능 최적화 팁

### 1. 인덱스 활용

```typescript
// ✅ 좋은 예: 인덱스 사용
WHERE clerk_user_id = ? AND is_active = 1

// ❌ 나쁜 예: 인덱스 미사용
WHERE LOWER(title) LIKE '%engineer%'
```

### 2. LIMIT 사용

```typescript
// ✅ 대량 데이터는 페이지네이션
SELECT * FROM resumes 
WHERE clerk_user_id = ? 
ORDER BY created_at DESC 
LIMIT 20 OFFSET 0
```

### 3. JOIN 최소화

```typescript
// ✅ 필요한 컬럼만 SELECT
SELECT r.resume_id, r.title, r.score
FROM resumes r
WHERE r.clerk_user_id = ?
```

---

## 관련 문서

- [데이터베이스 스키마](./schema.md)
- [데이터베이스 설정](./setup.md)
- [헬퍼 함수](../../lib/db.ts)

---

**마지막 업데이트**: 2025년 11월 9일

