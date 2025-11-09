# 🚀 데이터베이스 빠른 시작 가이드

PrepUp 프로젝트에서 D1 데이터베이스와 R2 스토리지를 빠르게 시작하는 방법입니다.

## ⚡ 5분 안에 시작하기

### 1️⃣ D1 데이터베이스 생성 및 설정

```bash
# D1 데이터베이스 생성
npx wrangler d1 create prepup-db
```

출력된 `database_id`를 복사하여 `wrangler.jsonc` 37번 줄에 입력:

```jsonc
"database_id": "여기에-복사한-id-입력"
```

### 2️⃣ 스키마 적용

```bash
# 로컬 개발 환경
npx wrangler d1 execute prepup-db --local --file=./schema.sql

# 프로덕션 환경
npx wrangler d1 execute prepup-db --remote --file=./schema.sql
```

### 3️⃣ R2 버킷 생성

```bash
# 이력서 파일 저장용
npx wrangler r2 bucket create prepup-files
```

### 4️⃣ 완료! 🎉

이제 코드에서 사용할 수 있습니다.

## 💻 코드에서 사용하기

### 데이터 조회

```typescript
import { queryAll } from '@/lib/db';
import type { Resume } from '@/types/database';

// 이력서 목록 가져오기
const resumes = await queryAll<Resume>(
  'SELECT * FROM resumes WHERE clerk_user_id = ?',
  userId
);
```

### 데이터 삽입

```typescript
import { execute, generateId } from '@/lib/db';

// 이력서 생성
const resumeId = generateId();
await execute(
  'INSERT INTO resumes (resume_id, clerk_user_id, title) VALUES (?, ?, ?)',
  resumeId,
  userId,
  'My Resume'
);
```

### 파일 업로드 (R2)

```typescript
import { uploadFile } from '@/lib/db';

// 이력서 파일 업로드
const fileKey = `resumes/${userId}/${Date.now()}.pdf`;
await uploadFile(fileKey, file.stream(), {
  contentType: 'application/pdf'
});
```

### 파일 다운로드 (R2)

```typescript
import { getFile } from '@/lib/db';

// 파일 가져오기
const file = await getFile(fileKey);
if (file) {
  return new Response(file.body);
}
```

## 📊 주요 테이블

| 테이블 | 용도 | 주요 컬럼 |
|--------|------|-----------|
| `users` | Clerk 사용자 | clerk_user_id, email, subscription_tier |
| `resumes` | 이력서 관리 | resume_id, clerk_user_id, file_url, score |
| `interview_questions` | 질문 라이브러리 | question_id, category, difficulty |
| `mock_interview_sessions` | 모의 인터뷰 | session_id, recording_url, overall_score |
| `subscriptions` | 구독 관리 | subscription_id, tier, payment_provider |

## 🔧 헬퍼 함수

프로젝트에 포함된 편리한 헬퍼 함수들:

```typescript
// lib/db.ts에서 제공
import {
  queryOne,      // 단일 레코드 조회
  queryAll,      // 여러 레코드 조회
  execute,       // INSERT/UPDATE/DELETE
  transaction,   // 트랜잭션
  generateId,    // UUID 생성
  uploadFile,    // R2 업로드
  getFile,       // R2 다운로드
  deleteFile,    // R2 삭제
  listFiles      // R2 파일 목록
} from '@/lib/db';
```

## 🎯 다음 단계

1. **Clerk Webhook 설정** - 사용자 자동 동기화
   - `MIGRATION_GUIDE.md` 참고
   
2. **타입 활용** - TypeScript 타입 정의 사용
   - `types/database.ts` 참고

3. **상세 가이드** - 더 많은 예제와 설명
   - `D1_R2_SETUP.md` 참고

## 🐛 문제 해결

### "Database not found" 오류

```bash
# database_id가 올바른지 확인
npx wrangler d1 info prepup-db
```

### 타입 오류

```bash
# 타입 재생성
npm run cf-typegen
```

### 로컬 개발 시 데이터 초기화

```bash
# 로컬 DB 삭제 후 재생성
npx wrangler d1 execute prepup-db --local --file=./schema.sql
```

## 📚 참고 문서

- 📄 `schema.sql` - 데이터베이스 스키마
- 📄 `lib/db.ts` - 헬퍼 함수
- 📄 `types/database.ts` - TypeScript 타입
- 📄 `D1_R2_SETUP.md` - 상세 설정 가이드
- 📄 `MIGRATION_GUIDE.md` - 마이그레이션 가이드

---

**준비 완료!** 이제 D1과 R2를 사용하여 PrepUp을 구축할 수 있습니다! 🚀

