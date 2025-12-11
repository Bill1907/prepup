# PrepUp 프로젝트 전체 분석 보고서
*생성일: 2025-12-11*
*분석자: Claude Code*

## 📋 Executive Summary

PrepUp은 Next.js 16 App Router + Cloudflare Workers 기반의 면접 준비 플랫폼입니다. 현재 **이중 데이터베이스 접근 방식**을 사용하고 있어 구조적 개선이 필요한 상태입니다.

### 핵심 발견사항
- ✅ **구현 완료**: Resume 업로드/분석, Questions 관리
- ⚠️ **부분 구현**: Dashboard (Mock data만 표시)
- ❌ **미구현**: User Notes, Usage Stats, Subscriptions, Mock Interview 기능
- 🔴 **Critical Issue**: SQLite schema vs PostgreSQL DB 불일치

---

## 🏗️ 현재 아키텍처

### Technology Stack
```yaml
Frontend:
  - Framework: Next.js 16 (App Router)
  - UI: shadcn/ui + Radix UI
  - State: TanStack Query v5
  - Auth: Clerk

Backend:
  - Platform: Cloudflare Workers (via OpenNext)
  - Database: Neon PostgreSQL (production branch)
  - GraphQL: Hasura (local, port 8080)
  - ORM: Drizzle (SQLite schema - MISMATCH!)
  - AI: OpenAI GPT-4o (Assistants API)
  - Storage: Cloudflare R2

Deployment:
  - Platform: Cloudflare Workers
  - Build: OpenNext for Cloudflare
```

### 데이터 접근 패턴 (이중 구조)
```
┌─────────────────────────────────────────────────────┐
│ Client-side (React Components)                      │
│ ├─ TanStack Query Hooks                             │
│ │  └─ GraphQL Client → Hasura → Neon PostgreSQL    │
│ └─ Server Actions (form submissions)                │
│    └─ Drizzle ORM → SQLite Schema → Neon PostgreSQL│
└─────────────────────────────────────────────────────┘
```

**문제점**: Server Actions는 SQLite schema를 사용하지만 실제 DB는 PostgreSQL

---

## 📊 구현 현황 분석

### ✅ 완전 구현된 기능

#### 1. Resume Management
**구현 완료도**: 85%

**Client-side** (`hooks/use-resumes.ts`):
- ✅ `useResumes()` - 이력서 목록 조회 (GraphQL)
- ✅ `useResume(id)` - 단일 이력서 조회 (GraphQL)
- ✅ `useResumeStats()` - 통계 (GraphQL)
- ✅ `useDeleteResume()` - Soft delete with optimistic updates
- ✅ `useUpdateResumeAnalysis()` - AI 분석 결과 업데이트
- ✅ `useUploadResume()` - Presigned URL + R2 upload + GraphQL metadata

**Server Actions** (`app/actions/resume-actions.ts`):
- ✅ `deleteResume()` - Drizzle ORM 사용
- ✅ `analyzeResume()` - OpenAI Assistants API + File upload

**API Routes**:
- ✅ `/api/resumes/upload/presigned-url` - R2 presigned URL 생성
- ✅ `/api/resumes/[id]/download` - Presigned download URL
- ✅ `/api/resumes/[id]/file` - 파일 제공

**UI Pages**:
- ✅ `/service/resume` - 이력서 목록 + 업로드
- ✅ `/service/resume/[id]` - 이력서 상세 + PDF 뷰어
- ✅ `/service/resume/[id]/history` - AI 분석 히스토리

**미구현 부분**:
- ❌ Resume content editing
- ❌ Version control UI
- ❌ Comparison between versions

#### 2. Interview Questions
**구현 완료도**: 75%

**Client-side** (`hooks/use-questions.ts`):
- ✅ `useQuestions()` - 전체 질문 목록
- ✅ `useQuestionsByResume(resumeId)` - 이력서별 질문
- ✅ `useQuestionStats()` - 카테고리별 통계
- ✅ `useToggleBookmark()` - 북마크 토글
- ✅ `useDeleteQuestion()` - 질문 삭제

**GraphQL Queries** (`lib/graphql/queries/questions.ts`):
- ✅ GET_QUESTIONS
- ✅ GET_QUESTIONS_BY_RESUME
- ✅ GET_QUESTION_STATS
- ✅ GET_BOOKMARKED_QUESTIONS
- ✅ TOGGLE_BOOKMARK
- ✅ DELETE_QUESTION
- ✅ CREATE_QUESTIONS

**UI Pages**:
- ✅ `/service/questions` - 질문 목록 + 필터링
- ✅ Category grid with statistics
- ✅ Question cards with bookmark

**미구현 부분**:
- ❌ AI Question Generation (Issue #5)
- ❌ Question generation form UI
- ❌ Server action for AI generation

### 🟡 부분 구현된 기능

#### 3. Dashboard
**구현 완료도**: 30% (Mock data only)

**현재 상태** (`app/service/dashboard/page.tsx`):
- ✅ UI Layout 완성
- ✅ Stats cards (Resume Reviews, Questions, Mock Interviews, Success Rate)
- ✅ Quick Actions (Resume, Questions, Mock Interview links)
- ✅ Recent Activity list
- ✅ Weekly Progress bars
- ✅ Upcoming Sessions

**문제점**:
- ❌ **모든 데이터가 하드코딩된 Mock data**
- ❌ Real user statistics 연결 안됨
- ❌ usage_stats 테이블 미사용

**필요 작업** (Issue #3):
1. GraphQL queries for real statistics
2. Connect to usage_stats table
3. Recent activity from actual user actions
4. Real-time data updates

### ❌ 미구현 기능

#### 4. Mock Interview
**구현 완료도**: 5% (빈 페이지만 존재)

**현재 상태**:
- ✅ `/service/mock-interview/page.tsx` 존재
- ❌ 실제 기능 없음

**DB Schema 준비 상태**:
- ✅ `mock_interview_sessions` 테이블 정의됨
- ✅ `interview_answers` 테이블 정의됨
- ❌ GraphQL queries/mutations 없음
- ❌ Hooks 없음
- ❌ Server actions 없음

#### 5. User Notes
**구현 완료도**: 0%

**DB Schema**:
- ✅ `user_notes` 테이블 정의됨 (schema.ts)

**미구현**:
- ❌ GraphQL queries
- ❌ Hooks
- ❌ UI components
- ❌ Server actions

#### 6. Usage Statistics
**구현 완료도**: 0%

**DB Schema**:
- ✅ `usage_stats` 테이블 정의됨

**미구현**:
- ❌ GraphQL queries (Issue #10)
- ❌ Analytics tracking
- ❌ Dashboard integration
- ❌ Auto-update on user actions

#### 7. Subscriptions
**구현 완료도**: 0%

**DB Schema**:
- ✅ `subscriptions` 테이블 정의됨

**미구현**:
- ❌ Payment integration (Issue #6)
- ❌ Subscription plans UI
- ❌ GraphQL mutations
- ❌ Webhook handlers

#### 8. Settings
**구현 완료도**: 5%

**현재 상태**:
- ✅ `/service/settings/page.tsx` 존재
- ❌ 거의 빈 페이지

**미구현**:
- ❌ User profile editing
- ❌ Language preference
- ❌ Notification settings

---

## 🔴 Critical Issues

### Issue #8: Database Schema Mismatch
**Priority**: 🔴 HIGH - Data Integrity

**Problem**:
```typescript
// lib/db/schema.ts - WRONG!
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

// But actual DB is:
NEON_DATABASE_URL = "postgresql://..."
```

**Impact**:
- 10+ files using SQLite schema (`app/actions/`, `app/api/resumes/`)
- Potential data type mismatches
- Query incompatibilities
- Risk of data corruption

**Used in**:
```bash
app/actions/resume-actions.ts
app/actions/question-actions.ts
app/api/resumes/route.ts
app/api/resumes/[id]/file/route.ts
app/api/resumes/[id]/download/route.ts
app/api/resumes/[id]/route.ts
app/api/resumes/[id]/history/route.ts
app/api/resumes/upload/complete/route.ts
app/api/resumes/upload/route.ts
app/api/webhooks/clerk/route.ts
```

**Solution Needed**:
1. Convert to `drizzle-orm/pg-core`
2. Use proper PostgreSQL types (uuid, timestamp, jsonb)
3. Create migration script
4. Test all affected endpoints

### Issue #4: Uncommitted Changes
**Priority**: 🟡 MEDIUM

**Current State**:
- GraphQL queries: ✅ Committed
- Hooks: ✅ Committed
- Questions feature: ✅ Committed

**Conclusion**: This issue seems **already resolved**. All GraphQL, hooks, and questions code are committed.

---

## 📈 기존 이슈 재평가

### 🟢 지금 바로 작업 가능한 이슈

#### Issue #3: Dashboard - Real User Statistics
**Complexity**: Medium | **Impact**: High | **Dependencies**: None

**Why Now**:
- UI already exists (just needs data hookup)
- GraphQL client ready
- Database tables exist
- Clear requirements

**Implementation Plan**:
1. Create GraphQL queries for real stats
2. Create `useUsageStats()` hook
3. Connect dashboard to real data
4. Add auto-increment on user actions

**Estimated Time**: 4-6 hours

---

#### Issue #5: AI Question Generation
**Complexity**: Medium | **Impact**: High | **Dependencies**: OpenAI API (ready)

**Why Now**:
- Questions UI exists
- OpenAI client ready (`lib/openaiClient.ts`)
- Database schema ready
- GraphQL mutations exist

**Implementation Plan**:
1. Create question generation form UI
2. Server action with OpenAI API
3. Parse and save questions to DB
4. Hook up to existing questions list

**Estimated Time**: 6-8 hours

---

#### Issue #11: Documentation
**Complexity**: Low | **Impact**: Medium | **Dependencies**: None

**Why Now**:
- Project structure is clear
- Architecture is documented
- Can improve onboarding

**Implementation Plan**:
1. API documentation
2. Database schema docs
3. Development guide
4. Deployment guide

**Estimated Time**: 4-6 hours

---

### 🟡 작업 가능하지만 선행 작업 필요

#### Issue #10: Usage Statistics & Analytics
**Complexity**: Medium | **Impact**: Medium | **Dependencies**: Issue #3

**Why Wait**:
- Should complete Dashboard (#3) first
- Needs usage tracking strategy
- Requires analytics design

**Prerequisites**:
- Complete Issue #3
- Design analytics events
- Define KPIs

---

#### Issue #9: User Notes Feature
**Complexity**: Low | **Impact**: Low | **Dependencies**: None (but low priority)

**Why Wait**:
- Lower priority than core features
- Can be added incrementally
- Not blocking other features

---

### 🔴 지금은 작업 불가능한 이슈

#### Issue #8: Database Schema Mismatch
**Why Not Now**:
- High risk of breaking changes
- Requires comprehensive testing
- Need backup/rollback plan
- Should fix in separate branch with full QA

**Prerequisites**:
1. Comprehensive test coverage
2. Database backup
3. Migration strategy
4. Rollback plan

---

#### Issue #12: Performance Optimization
**Why Not Now**:
- Need baseline metrics first
- Premature optimization
- Should measure before optimizing

**Prerequisites**:
1. Set up performance monitoring
2. Collect baseline metrics
3. Identify bottlenecks
4. Then optimize

---

#### Issue #6: Subscription & Payment
**Complexity**: High | **Impact**: Medium | **Dependencies**: Payment provider setup

**Why Not Now**:
- Requires payment provider account
- Complex integration
- Need legal/business decisions
- Should be done after core features

**Prerequisites**:
1. Choose payment provider (Toss, Kakao, Paddle)
2. Set up merchant account
3. Define pricing tiers
4. Legal requirements (terms, privacy)

---

#### Issue #7: Test Coverage
**Why Not Now**:
- Should write tests alongside feature development
- Not a standalone task
- Better to add tests incrementally

**Strategy**:
- Add tests with each new feature
- Prioritize critical paths
- Use Vitest (already configured)

---

## 🎯 추천 작업 순서

### Phase 1: Quick Wins (1-2 weeks)
```
1. Issue #3: Dashboard Real Data (4-6h)
   → Immediate user value
   → Low complexity
   → No dependencies

2. Issue #5: AI Question Generation (6-8h)
   → High user value
   → Uses existing infrastructure
   → Completes questions feature

3. Issue #11: Documentation (4-6h)
   → Helps team onboarding
   → Low effort, high impact
   → Can do in parallel
```

### Phase 2: Foundation Work (2-4 weeks)
```
4. Issue #10: Usage Stats & Analytics (8-12h)
   → Builds on Issue #3
   → Enables data-driven decisions
   → Required for future features

5. Issue #9: User Notes (4-6h)
   → Nice-to-have feature
   → Low complexity
   → Completes questions ecosystem
```

### Phase 3: Infrastructure (4-6 weeks)
```
6. Issue #8: Database Schema Migration (16-24h)
   → CRITICAL for long-term stability
   → Requires careful planning
   → Should be done in isolation
   → Needs comprehensive testing
```

### Phase 4: Advanced Features (6-8 weeks)
```
7. Issue #6: Subscriptions (20-30h)
   → Revenue enabler
   → Complex integration
   → Requires business decisions

8. Mock Interview Implementation (30-40h)
   → Core feature
   → Complex audio/video handling
   → AI evaluation
```

### Continuous
```
- Issue #7: Tests (ongoing)
  → Add with each feature
  → Prioritize critical paths

- Issue #12: Performance (ongoing)
  → Monitor metrics
  → Optimize bottlenecks
  → Incremental improvements
```

---

## 💡 새로운 이슈 제안

### 1. 🔴 Critical: Unified Data Access Layer
**Problem**: 이중 데이터베이스 접근 방식 (GraphQL + Drizzle)

**Proposal**:
- Option A: GraphQL only (remove Drizzle)
- Option B: Drizzle only (remove GraphQL/Hasura)
- Option C: Keep both, but clarify usage patterns

**Recommendation**: Option A (GraphQL only)
- Hasura provides auto-generated GraphQL
- Better for client-side data fetching
- Removes Drizzle schema mismatch
- Simpler architecture

### 2. 🟡 Medium: Error Handling & Logging
**Current State**: Basic try-catch, console.log

**Proposal**:
- Centralized error handling
- Structured logging (for Cloudflare Workers)
- Error tracking service (Sentry?)
- User-friendly error messages

### 3. 🟢 Low: E2E Testing Setup
**Current State**: Only unit test setup (Vitest)

**Proposal**:
- Playwright for E2E tests
- Critical user flows
- CI/CD integration

---

## 📝 Conclusion

### What Works Well
✅ Resume upload & AI analysis
✅ Questions management
✅ GraphQL + TanStack Query architecture
✅ Cloudflare Workers deployment
✅ R2 file storage

### What Needs Attention
⚠️ Database schema mismatch (Critical!)
⚠️ Dual data access pattern (confusing)
⚠️ Mock data in dashboard
⚠️ Missing core features (Mock Interview)
⚠️ No usage tracking/analytics

### Immediate Next Steps
1. **Start with Issue #3** (Dashboard Real Data)
   - Quick win
   - High user value
   - No dependencies

2. **Then Issue #5** (AI Questions)
   - Completes questions feature
   - Uses existing infrastructure

3. **Plan for Issue #8** (Schema Migration)
   - Create separate branch
   - Write comprehensive tests first
   - Plan migration strategy

### Strategic Recommendations
1. **Choose One Data Access Pattern**
   - Recommend: GraphQL-only
   - Remove Drizzle ORM
   - Simplify architecture

2. **Focus on Core Features First**
   - Dashboard → Questions → Mock Interview
   - Defer subscriptions until later

3. **Improve Testing Culture**
   - Add tests with each feature
   - E2E tests for critical flows
   - CI/CD with test gates

---

*End of Analysis Report*
