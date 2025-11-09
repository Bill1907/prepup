# D1 데이터베이스와 R2 스토리지 설정 가이드

PrepUp 프로젝트에서 Cloudflare D1 데이터베이스와 R2 스토리지를 사용하는 방법입니다.

## 📋 목차

1. [D1 데이터베이스 설정](#d1-데이터베이스-설정)
2. [R2 스토리지 설정](#r2-스토리지-설정)
3. [TypeScript 타입 정의](#typescript-타입-정의)
4. [사용 예제](#사용-예제)

---

## 🗄️ D1 데이터베이스 설정

### 1. D1 데이터베이스 생성

```bash
# D1 데이터베이스 생성
npx wrangler d1 create prepup-db
```

이 명령어를 실행하면 다음과 같은 출력이 나옵니다:

```
✅ Successfully created DB 'prepup-db'

[[d1_databases]]
binding = "DB"
database_name = "prepup-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

### 2. database_id 복사

생성된 `database_id`를 복사하여 `wrangler.jsonc` 파일에 입력하세요:

```jsonc
"d1_databases": [
  {
    "binding": "DB",
    "database_name": "prepup-db",
    "database_id": "여기에-복사한-database-id-입력"
  }
]
```

### 3. 데이터베이스 스키마 적용

`schema.sql` 파일이 이미 생성되어 있습니다. 이 파일을 사용하여 스키마를 적용합니다:

주요 테이블 구조:

- **users**: Clerk 사용자 정보 (clerk_user_id 기반)
- **resumes**: 이력서 관리 (R2 file_url 포함)
- **interview_questions**: 질문 라이브러리
- **mock_interview_sessions**: 모의 인터뷰 세션
- **interview_answers**: 세션별 답변 기록
- **subscriptions**: 구독 및 결제 관리 (Toss/Kakao/Paddle)
- **user_notes**: 사용자 노트
- **usage_stats**: 사용 통계

자세한 스키마는 `schema.sql` 파일을 참고하세요.

### 4. 스키마 적용

```bash
# 로컬 개발 환경에 스키마 적용
npx wrangler d1 execute prepup-db --local --file=./schema.sql

# 프로덕션 환경에 스키마 적용
npx wrangler d1 execute prepup-db --remote --file=./schema.sql
```

### 5. D1 데이터베이스 사용 예제

#### 방법 1: 헬퍼 함수 사용 (권장)

```typescript
// app/api/resumes/route.ts
import { auth } from "@clerk/nextjs/server";
import { queryAll, queryOne } from "@/lib/db";
import type { Resume } from "@/types/database";

export async function GET(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 헬퍼 함수로 간편하게 쿼리
  const resumes = await queryAll<Resume>(
    "SELECT * FROM resumes WHERE clerk_user_id = ? AND is_active = 1 ORDER BY created_at DESC",
    userId
  );

  return Response.json(resumes);
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  // 헬퍼 함수로 데이터 삽입
  const resumeId = generateId();
  await execute(
    `INSERT INTO resumes (
      resume_id, clerk_user_id, title, file_url, 
      version, is_active, score
    ) VALUES (?, ?, ?, ?, 1, 1, 0)`,
    resumeId,
    userId,
    body.title,
    body.fileUrl
  );

  return Response.json({ success: true, id: resumeId });
}
```

#### 방법 2: 직접 사용

```typescript
import { getRequestContext } from "@cloudflare/next-on-pages";

export async function GET(request: Request) {
  const { env } = getRequestContext();

  const { results } = await env.DB.prepare(
    "SELECT * FROM resumes WHERE clerk_user_id = ?"
  )
    .bind(userId)
    .all();

  return Response.json(results);
}
```

---

## 📦 R2 스토리지 설정

### 1. R2 버킷 생성

```bash
# R2 버킷 생성 (이력서 파일 저장용)
npx wrangler r2 bucket create prepup-files

# 추가 버킷 (인터뷰 녹화 파일용)
npx wrangler r2 bucket create prepup-recordings
```

### 2. wrangler.jsonc 업데이트

```jsonc
"r2_buckets": [
  {
    "binding": "FILES",
    "bucket_name": "prepup-files"
  },
  {
    "binding": "RECORDINGS",
    "bucket_name": "prepup-recordings"
  }
]
```

### 3. TypeScript 타입 추가

`cloudflare-env.d.ts` 파일에 추가:

```typescript
interface CloudflareEnv {
  DB: D1Database;
  FILES: R2Bucket;
  RECORDINGS: R2Bucket;
}
```

### 4. R2 스토리지 사용 예제

```typescript
// 파일 업로드
import { getRequestContext } from "@cloudflare/next-on-pages";

export async function POST(request: Request) {
  const { env } = getRequestContext();
  const formData = await request.formData();
  const file = formData.get("file") as File;

  if (!file) {
    return Response.json({ error: "No file provided" }, { status: 400 });
  }

  const fileName = `resumes/${Date.now()}-${file.name}`;

  // R2에 파일 업로드
  await env.FILES.put(fileName, file.stream(), {
    httpMetadata: {
      contentType: file.type,
    },
  });

  return Response.json({
    success: true,
    fileName,
    url: `/api/files/${fileName}`,
  });
}

// 파일 다운로드
export async function GET(
  request: Request,
  { params }: { params: { fileName: string } }
) {
  const { env } = getRequestContext();
  const fileName = params.fileName;

  // R2에서 파일 가져오기
  const object = await env.FILES.get(fileName);

  if (!object) {
    return Response.json({ error: "File not found" }, { status: 404 });
  }

  return new Response(object.body, {
    headers: {
      "Content-Type":
        object.httpMetadata?.contentType || "application/octet-stream",
      "Content-Length": object.size.toString(),
    },
  });
}

// 파일 삭제
export async function DELETE(
  request: Request,
  { params }: { params: { fileName: string } }
) {
  const { env } = getRequestContext();
  const fileName = params.fileName;

  await env.FILES.delete(fileName);

  return Response.json({ success: true });
}
```

---

## 🔧 TypeScript 타입 정의

`cloudflare-env.d.ts` 파일:

```typescript
interface CloudflareEnv {
  // D1 Database binding
  DB: D1Database;

  // R2 Storage bindings
  FILES: R2Bucket;
  RECORDINGS: R2Bucket;
}
```

타입 재생성:

```bash
npm run cf-typegen
```

---

## 📝 사용 예제

### Server Action에서 사용

```typescript
// app/actions/resume.ts
"use server";

import { getRequestContext } from "@cloudflare/next-on-pages";
import { auth } from "@clerk/nextjs/server";

export async function uploadResume(formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const { env } = getRequestContext();
  const file = formData.get("file") as File;

  // R2에 파일 저장
  const fileName = `resumes/${userId}/${Date.now()}-${file.name}`;
  await env.FILES.put(fileName, file.stream(), {
    httpMetadata: { contentType: file.type },
  });

  // D1에 메타데이터 저장
  const resumeId = crypto.randomUUID();
  await env.DB.prepare(
    "INSERT INTO resumes (id, user_id, title, file_path, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
  )
    .bind(
      resumeId,
      userId,
      file.name,
      fileName,
      "uploaded",
      Date.now(),
      Date.now()
    )
    .run();

  return { success: true, id: resumeId };
}

export async function getResumes() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const { env } = getRequestContext();

  const { results } = await env.DB.prepare(
    "SELECT * FROM resumes WHERE user_id = ? ORDER BY created_at DESC"
  )
    .bind(userId)
    .all();

  return results;
}
```

### API Route에서 사용

```typescript
// app/api/files/[...path]/route.ts
import { getRequestContext } from "@cloudflare/next-on-pages";
import { auth } from "@clerk/nextjs/server";

export async function GET(
  request: Request,
  { params }: { params: { path: string[] } }
) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { env } = getRequestContext();
  const filePath = params.path.join("/");

  // 사용자가 파일에 접근 권한이 있는지 확인
  const { results } = await env.DB.prepare(
    "SELECT * FROM resumes WHERE user_id = ? AND file_path = ?"
  )
    .bind(userId, filePath)
    .all();

  if (results.length === 0) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  // R2에서 파일 가져오기
  const object = await env.FILES.get(filePath);

  if (!object) {
    return Response.json({ error: "File not found" }, { status: 404 });
  }

  return new Response(object.body, {
    headers: {
      "Content-Type":
        object.httpMetadata?.contentType || "application/octet-stream",
      "Cache-Control": "private, max-age=3600",
    },
  });
}
```

---

## 🛠️ 개발 환경 설정

### 로컬 개발

로컬에서 D1과 R2를 테스트하려면:

```bash
# 로컬 D1 데이터베이스 사용
npx wrangler d1 execute prepup-db --local --command="SELECT * FROM resumes"

# 로컬에서 개발 서버 실행
npm run dev
```

### 환경별 설정

`wrangler.jsonc`에서 환경별로 다른 바인딩을 사용할 수 있습니다:

```jsonc
{
  "name": "prepup",
  // ... 기본 설정
  "env": {
    "production": {
      "d1_databases": [
        {
          "binding": "DB",
          "database_name": "prepup-db-prod",
          "database_id": "prod-database-id",
        },
      ],
      "r2_buckets": [
        {
          "binding": "FILES",
          "bucket_name": "prepup-files-prod",
        },
      ],
    },
    "staging": {
      "d1_databases": [
        {
          "binding": "DB",
          "database_name": "prepup-db-staging",
          "database_id": "staging-database-id",
        },
      ],
      "r2_buckets": [
        {
          "binding": "FILES",
          "bucket_name": "prepup-files-staging",
        },
      ],
    },
  },
}
```

---

## 📚 추가 리소스

- [Cloudflare D1 문서](https://developers.cloudflare.com/d1/)
- [Cloudflare R2 문서](https://developers.cloudflare.com/r2/)
- [OpenNext Cloudflare 문서](https://opennext.js.org/cloudflare)

---

## 🔍 유용한 명령어

```bash
# D1 데이터베이스 목록 보기
npx wrangler d1 list

# D1 데이터베이스 정보 확인
npx wrangler d1 info prepup-db

# D1 쿼리 실행
npx wrangler d1 execute prepup-db --remote --command="SELECT COUNT(*) FROM resumes"

# R2 버킷 목록 보기
npx wrangler r2 bucket list

# R2 버킷 내 파일 목록 보기
npx wrangler r2 object list prepup-files

# 타입 재생성
npm run cf-typegen
```

---

이제 PrepUp 프로젝트에서 D1 데이터베이스와 R2 스토리지를 사용할 준비가 완료되었습니다! 🎉
