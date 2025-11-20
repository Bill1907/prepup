-- PrepUp D1 Database Schema (Optimized for Clerk + Cloudflare)
-- Foreign Keys 활성화
PRAGMA foreign_keys = ON;

-- 공통: updated_at 자동 갱신 트리거 헬퍼
-- 각 테이블별로 AFTER UPDATE 트리거를 둔다.

-- 1) USERS (Clerk 동기화)
CREATE TABLE IF NOT EXISTS users (
  clerk_user_id         TEXT PRIMARY KEY,
  language_preference   TEXT NOT NULL DEFAULT 'en',
  created_at            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER IF NOT EXISTS trg_users_updated
AFTER UPDATE ON users
FOR EACH ROW BEGIN
  UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE clerk_user_id = NEW.clerk_user_id;
END;

-- 2) RESUMES
CREATE TABLE IF NOT EXISTS resumes (
  resume_id      TEXT PRIMARY KEY,
  clerk_user_id  TEXT NOT NULL,
  title          TEXT NOT NULL,
  content        TEXT,                    -- 원문(에디터) 저장
  version        INTEGER NOT NULL DEFAULT 1,
  is_active      INTEGER NOT NULL DEFAULT 1,   -- BOOLEAN ↔ INTEGER(0/1)
  file_url       TEXT,                    -- R2 URL
  ai_feedback    TEXT,                    -- JSON as TEXT
  score          INTEGER CHECK (score BETWEEN 0 AND 100),
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (clerk_user_id) REFERENCES users(clerk_user_id) ON DELETE CASCADE
);

CREATE TRIGGER IF NOT EXISTS trg_resumes_updated
AFTER UPDATE ON resumes
FOR EACH ROW BEGIN
  UPDATE resumes SET updated_at = CURRENT_TIMESTAMP WHERE resume_id = NEW.resume_id;
END;

CREATE INDEX IF NOT EXISTS idx_resumes_user ON resumes(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_resumes_active ON resumes(is_active);

-- 3) RESUME HISTORY
CREATE TABLE IF NOT EXISTS resume_history (
  history_id      TEXT PRIMARY KEY,
  resume_id       TEXT NOT NULL,
  clerk_user_id   TEXT NOT NULL,
  title           TEXT NOT NULL,
  content         TEXT,
  version         INTEGER NOT NULL,
  file_url        TEXT,
  ai_feedback     TEXT,
  score           INTEGER CHECK (score BETWEEN 0 AND 100),
  change_reason   TEXT,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (resume_id) REFERENCES resumes(resume_id) ON DELETE CASCADE,
  FOREIGN KEY (clerk_user_id) REFERENCES users(clerk_user_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_history_resume ON resume_history(resume_id);
CREATE INDEX IF NOT EXISTS idx_history_user ON resume_history(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_history_created ON resume_history(created_at);

-- 4) INTERVIEW QUESTIONS
CREATE TABLE IF NOT EXISTS interview_questions (
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

CREATE INDEX IF NOT EXISTS idx_q_user ON interview_questions(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_q_resume ON interview_questions(resume_id);
CREATE INDEX IF NOT EXISTS idx_q_cat_diff ON interview_questions(category, difficulty);

-- 5) MOCK INTERVIEW SESSIONS
CREATE TABLE IF NOT EXISTS mock_interview_sessions (
  session_id      TEXT PRIMARY KEY,
  clerk_user_id   TEXT NOT NULL,
  resume_id       TEXT, -- nullable
  start_time      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  end_time        DATETIME,
  duration_seconds INTEGER,
  questions_count INTEGER,
  recording_url   TEXT,        -- R2 URL
  ai_evaluation   TEXT,        -- JSON as TEXT
  overall_score   INTEGER CHECK (overall_score BETWEEN 0 AND 100),
  status          TEXT CHECK (status IN ('in_progress','completed','paused')) NOT NULL DEFAULT 'in_progress',
  FOREIGN KEY (clerk_user_id) REFERENCES users(clerk_user_id) ON DELETE CASCADE,
  FOREIGN KEY (resume_id) REFERENCES resumes(resume_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON mock_interview_sessions(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON mock_interview_sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_start ON mock_interview_sessions(start_time);

-- 6) INTERVIEW ANSWERS
CREATE TABLE IF NOT EXISTS interview_answers (
  answer_id       TEXT PRIMARY KEY,
  session_id      TEXT NOT NULL,
  question_id     TEXT NOT NULL,
  user_answer     TEXT,
  audio_url       TEXT,       -- R2 URL
  duration_seconds INTEGER,
  ai_feedback     TEXT,       -- JSON as TEXT
  score           INTEGER CHECK (score BETWEEN 0 AND 100),
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES mock_interview_sessions(session_id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES interview_questions(question_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_answers_session ON interview_answers(session_id);
CREATE INDEX IF NOT EXISTS idx_answers_question ON interview_answers(question_id);

-- 7) SUBSCRIPTIONS (결제: Toss 우선, 이후 Kakao/Paddle 확장)
CREATE TABLE IF NOT EXISTS subscriptions (
  subscription_id   TEXT PRIMARY KEY,
  clerk_user_id     TEXT NOT NULL UNIQUE,
  tier              TEXT CHECK (tier IN ('free','premium','pro')) NOT NULL,
  start_date        DATE NOT NULL,
  end_date          DATE,
  auto_renew        INTEGER NOT NULL DEFAULT 1,
  status            TEXT CHECK (status IN ('active','cancelled','expired')) NOT NULL DEFAULT 'active',
  payment_provider  TEXT CHECK (payment_provider IN ('toss_payments','kakao_pay','paddle')) DEFAULT 'toss_payments',
  transaction_id    TEXT,         -- PG사 거래 ID
  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (clerk_user_id) REFERENCES users(clerk_user_id) ON DELETE CASCADE
);

CREATE TRIGGER IF NOT EXISTS trg_subscriptions_updated
AFTER UPDATE ON subscriptions
FOR EACH ROW BEGIN
  UPDATE subscriptions SET updated_at = CURRENT_TIMESTAMP WHERE subscription_id = NEW.subscription_id;
END;

CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- 8) USER NOTES
CREATE TABLE IF NOT EXISTS user_notes (
  note_id        TEXT PRIMARY KEY,
  clerk_user_id  TEXT NOT NULL,
  question_id    TEXT,       -- nullable
  note_text      TEXT NOT NULL,
  is_public      INTEGER NOT NULL DEFAULT 0,
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (clerk_user_id) REFERENCES users(clerk_user_id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES interview_questions(question_id) ON DELETE SET NULL
);

CREATE TRIGGER IF NOT EXISTS trg_notes_updated
AFTER UPDATE ON user_notes
FOR EACH ROW BEGIN
  UPDATE user_notes SET updated_at = CURRENT_TIMESTAMP WHERE note_id = NEW.note_id;
END;

CREATE INDEX IF NOT EXISTS idx_notes_user ON user_notes(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_notes_question ON user_notes(question_id);

-- 9) USAGE STATS (집계용; 뷰/트리거로도 확장 가능)
CREATE TABLE IF NOT EXISTS usage_stats (
  stat_id                     TEXT PRIMARY KEY,
  clerk_user_id               TEXT NOT NULL,
  resumes_created             INTEGER NOT NULL DEFAULT 0,
  interviews_completed        INTEGER NOT NULL DEFAULT 0,
  total_mock_interview_minutes INTEGER NOT NULL DEFAULT 0,
  average_score               REAL,
  last_activity               DATETIME,
  FOREIGN KEY (clerk_user_id) REFERENCES users(clerk_user_id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_usage_user_unique ON usage_stats(clerk_user_id);

-- ============================================================
-- 샘플 데이터 (개발/테스트용)
-- 실제 프로덕션에서는 제거하거나 주석 처리하세요
-- ============================================================

-- 샘플 사용자 (Clerk 사용자 ID는 실제로는 Clerk에서 생성됨)
INSERT OR IGNORE INTO users (clerk_user_id, language_preference) VALUES
('user_sample_1', 'en'),
('user_sample_2', 'en');

-- 샘플 이력서
INSERT OR IGNORE INTO resumes (resume_id, clerk_user_id, title, content, version, is_active, score) VALUES
('resume_1', 'user_sample_1', 'Senior Software Engineer Resume', 'Resume content here...', 1, 1, 92),
('resume_2', 'user_sample_2', 'Product Manager Resume', 'Resume content here...', 1, 1, 85);

-- 샘플 인터뷰 질문
INSERT OR IGNORE INTO interview_questions (question_id, resume_id, clerk_user_id, question_text, category, difficulty, tips, suggested_answer) VALUES
('q_1', 'resume_1', 'user_sample_1', 'Tell me about a time when you had to deal with a difficult stakeholder', 'behavioral', 'medium', 'Use STAR method: Situation, Task, Action, Result', 'STAR Framework: Start with the situation, describe your task, explain your actions, and share the results.'),
('q_2', 'resume_1', 'user_sample_1', 'How would you design a URL shortening service like bit.ly?', 'technical', 'hard', 'Focus on scalability, database design, and caching strategies', 'Break down into: Requirements gathering, API design, Database schema, Scalability considerations'),
('q_3', 'resume_2', 'user_sample_2', 'Describe your experience with Agile methodologies', 'behavioral', 'easy', 'Mention specific ceremonies, tools, and team outcomes', 'Discuss sprints, stand-ups, retrospectives, and specific examples of success'),
('q_4', 'resume_1', 'user_sample_1', 'Implement a function to reverse a linked list', 'technical', 'medium', 'Consider both iterative and recursive approaches', 'Discuss time/space complexity, edge cases, and different implementation approaches'),
('q_5', 'resume_2', 'user_sample_2', 'How do you handle conflicts within your team?', 'behavioral', 'medium', 'Show emotional intelligence and conflict resolution skills', 'Use STAR method with focus on communication, empathy, and resolution');

-- 샘플 모의 인터뷰 세션
INSERT OR IGNORE INTO mock_interview_sessions (session_id, clerk_user_id, resume_id, start_time, end_time, duration_seconds, questions_count, overall_score, status) VALUES
('session_1', 'user_sample_1', 'resume_1', datetime('now', '-2 days'), datetime('now', '-2 days', '+35 minutes'), 2100, 5, 92, 'completed'),
('session_2', 'user_sample_2', 'resume_2', datetime('now', '-1 day'), datetime('now', '-1 day', '+28 minutes'), 1680, 4, 85, 'completed');

-- 샘플 구독
INSERT OR IGNORE INTO subscriptions (subscription_id, clerk_user_id, tier, start_date, end_date, auto_renew, status, payment_provider) VALUES
('sub_1', 'user_sample_1', 'free', date('now'), NULL, 1, 'active', 'toss_payments'),
('sub_2', 'user_sample_2', 'premium', date('now', '-30 days'), date('now', '+335 days'), 1, 'active', 'toss_payments');

-- 샘플 사용 통계
INSERT OR IGNORE INTO usage_stats (stat_id, clerk_user_id, resumes_created, interviews_completed, total_mock_interview_minutes, average_score, last_activity) VALUES
('stat_1', 'user_sample_1', 5, 12, 245, 87.5, datetime('now')),
('stat_2', 'user_sample_2', 3, 8, 180, 85.0, datetime('now', '-1 day'));
