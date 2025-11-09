# Clerk 인증 설정 가이드

PrepUp에서 Clerk를 사용한 인증 설정 및 사용 방법입니다.

## 📋 목차
- [Clerk 설정](#clerk-설정)
- [환경 변수](#환경-변수)
- [Webhook 설정](#webhook-설정)
- [미들웨어 설정](#미들웨어-설정)
- [클라이언트 사용](#클라이언트-사용)
- [서버 사용](#서버-사용)
- [보호된 라우트](#보호된-라우트)

## Clerk 설정

### 1. Clerk 계정 생성

1. [Clerk Dashboard](https://dashboard.clerk.com/)에서 계정 생성
2. 새 애플리케이션 생성
3. API Keys 복사

### 2. 환경 변수 설정

`.dev.vars` 파일에 추가:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...
```

프로덕션 환경 (Cloudflare):

```bash
npx wrangler secret put CLERK_SECRET_KEY
npx wrangler secret put CLERK_WEBHOOK_SECRET
```

### 3. Clerk Provider 설정

이미 `app/layout.tsx`에 설정되어 있습니다:

```typescript
import { ClerkProvider } from "@clerk/nextjs";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
```

---

## 환경 변수

### 필수 환경 변수

| 변수 | 설명 | 예시 |
|------|------|------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk 공개 키 | `pk_test_...` |
| `CLERK_SECRET_KEY` | Clerk 비밀 키 | `sk_test_...` |
| `CLERK_WEBHOOK_SECRET` | Webhook 비밀 키 | `whsec_...` |

### 선택 환경 변수

```env
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/auth/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/auth/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
```

---

## Webhook 설정

### 1. Webhook 엔드포인트 생성

```typescript
// app/api/webhooks/clerk/route.ts
import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { execute, generateId } from '@/lib/db';

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
  
  if (!WEBHOOK_SECRET) {
    throw new Error('Please add CLERK_WEBHOOK_SECRET to environment variables');
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

  const eventType = evt.type;

  // 사용자 생성
  if (eventType === 'user.created') {
    const { id, email_addresses, first_name, last_name, image_url } = evt.data;
    
    await execute(
      `INSERT INTO users (
        clerk_user_id, email, first_name, last_name, 
        profile_image_url, subscription_tier
      ) VALUES (?, ?, ?, ?, ?, 'free')`,
      id,
      email_addresses[0]?.email_address,
      first_name,
      last_name,
      image_url
    );

    // 기본 구독 생성
    await execute(
      `INSERT INTO subscriptions (
        subscription_id, clerk_user_id, tier, start_date,
        auto_renew, status, payment_provider
      ) VALUES (?, ?, 'free', date('now'), 1, 'active', 'toss_payments')`,
      generateId(),
      id
    );

    // 사용 통계 초기화
    await execute(
      `INSERT INTO usage_stats (
        stat_id, clerk_user_id, resumes_created, 
        interviews_completed, total_mock_interview_minutes
      ) VALUES (?, ?, 0, 0, 0)`,
      generateId(),
      id
    );
  }

  // 사용자 업데이트
  if (eventType === 'user.updated') {
    const { id, email_addresses, first_name, last_name, image_url } = evt.data;
    
    await execute(
      `UPDATE users 
       SET email = ?, first_name = ?, last_name = ?, profile_image_url = ?
       WHERE clerk_user_id = ?`,
      email_addresses[0]?.email_address,
      first_name,
      last_name,
      image_url,
      id
    );
  }

  // 사용자 삭제
  if (eventType === 'user.deleted') {
    const { id } = evt.data;
    await execute('DELETE FROM users WHERE clerk_user_id = ?', id);
  }

  return new Response('Webhook processed', { status: 200 });
}
```

### 2. Clerk Dashboard에서 Webhook 설정

1. [Clerk Dashboard](https://dashboard.clerk.com/) → Webhooks
2. Add Endpoint
3. URL: `https://your-domain.com/api/webhooks/clerk`
4. 이벤트 선택:
   - `user.created`
   - `user.updated`
   - `user.deleted`
5. Webhook Secret 복사

---

## 미들웨어 설정

```typescript
// middleware.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) await auth.protect();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
```

---

## 클라이언트 사용

### 로그인/회원가입 버튼

```typescript
"use client";

import { SignInButton, SignUpButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

export function AuthButtons() {
  return (
    <>
      <SignedOut>
        <SignInButton mode="modal">
          <Button variant="ghost">Sign In</Button>
        </SignInButton>
        <SignUpButton mode="modal">
          <Button>Get Started</Button>
        </SignUpButton>
      </SignedOut>
      <SignedIn>
        <UserButton />
      </SignedIn>
    </>
  );
}
```

### 사용자 정보 접근

```typescript
"use client";

import { useUser } from "@clerk/nextjs";

export function UserProfile() {
  const { isLoaded, isSignedIn, user } = useUser();

  if (!isLoaded) return <div>Loading...</div>;
  if (!isSignedIn) return <div>Not signed in</div>;

  return (
    <div>
      <p>Welcome, {user.firstName}!</p>
      <p>Email: {user.primaryEmailAddress?.emailAddress}</p>
    </div>
  );
}
```

---

## 서버 사용

### Server Components

```typescript
// app/dashboard/page.tsx
import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect("/auth/sign-in");
  }

  const user = await currentUser();

  return (
    <div>
      <h1>Welcome, {user?.firstName}!</h1>
    </div>
  );
}
```

### Server Actions

```typescript
"use server";

import { auth } from "@clerk/nextjs/server";
import { execute, generateId } from "@/lib/db";

export async function createResume(title: string, fileUrl: string) {
  const { userId } = await auth();
  
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const resumeId = generateId();
  await execute(
    "INSERT INTO resumes (resume_id, clerk_user_id, title, file_url) VALUES (?, ?, ?, ?)",
    resumeId, userId, title, fileUrl
  );

  return { success: true, resumeId };
}
```

### API Routes

```typescript
// app/api/resumes/route.ts
import { auth } from "@clerk/nextjs/server";
import { queryAll } from "@/lib/db";
import type { Resume } from "@/types/database";

export async function GET(request: Request) {
  const { userId } = await auth();
  
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resumes = await queryAll<Resume>(
    "SELECT * FROM resumes WHERE clerk_user_id = ?",
    userId
  );

  return Response.json(resumes);
}
```

---

## 보호된 라우트

### 페이지 레벨 보호

```typescript
// app/dashboard/settings/page.tsx
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect("/auth/sign-in");
  }

  // 페이지 내용...
}
```

### 조건부 렌더링

```typescript
"use client";

import { SignedIn, SignedOut } from "@clerk/nextjs";

export function ConditionalContent() {
  return (
    <>
      <SignedIn>
        <div>로그인된 사용자만 볼 수 있는 내용</div>
      </SignedIn>
      <SignedOut>
        <div>로그인하지 않은 사용자에게 표시되는 내용</div>
      </SignedOut>
    </>
  );
}
```

---

## 사용자 메타데이터

### Public Metadata 설정

```typescript
import { clerkClient } from "@clerk/nextjs/server";

await clerkClient.users.updateUserMetadata(userId, {
  publicMetadata: {
    subscriptionTier: "premium",
    onboardingComplete: true,
  },
});
```

### Private Metadata 설정

```typescript
await clerkClient.users.updateUserMetadata(userId, {
  privateMetadata: {
    stripeCustomerId: "cus_123456",
  },
});
```

### Metadata 읽기

```typescript
const user = await currentUser();
const subscriptionTier = user?.publicMetadata?.subscriptionTier;
```

---

## 세션 관리

### 세션 정보 확인

```typescript
import { auth } from "@clerk/nextjs/server";

const { sessionId, sessionClaims } = await auth();
```

### 세션 갱신

```typescript
"use client";

import { useSession } from "@clerk/nextjs";

export function SessionRefresh() {
  const { session } = useSession();
  
  // 세션 갱신
  const handleRefresh = async () => {
    await session?.reload();
  };

  return <button onClick={handleRefresh}>Refresh Session</button>;
}
```

---

## 에러 처리

### 인증 에러

```typescript
try {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  
  // 작업 수행...
} catch (error) {
  if (error.message === "Unauthorized") {
    redirect("/auth/sign-in");
  }
  throw error;
}
```

### Webhook 에러

```typescript
try {
  evt = wh.verify(body, headers) as WebhookEvent;
} catch (err) {
  console.error('Webhook verification failed:', err);
  return new Response('Error: Verification failed', { status: 400 });
}
```

---

## 커스터마이징

### 로그인 페이지 커스터마이징

```typescript
// app/auth/sign-in/page.tsx
import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <SignIn 
      appearance={{
        elements: {
          rootBox: "mx-auto",
          card: "shadow-lg",
          formButtonPrimary: "bg-blue-600 hover:bg-blue-700",
        }
      }}
      routing="path"
      path="/auth/sign-in"
    />
  );
}
```

### 사용자 프로필 커스터마이징

```typescript
<UserButton 
  appearance={{
    elements: {
      avatarBox: "w-10 h-10",
    }
  }}
  afterSignOutUrl="/"
/>
```

---

## 테스팅

### 테스트 사용자 생성

Clerk Dashboard에서 테스트 사용자를 생성하거나 개발 모드에서 자동으로 생성할 수 있습니다.

### 로컬 테스트

```bash
npm run dev
```

Clerk는 개발 모드에서 자동으로 테스트 환경을 제공합니다.

---

## 관련 문서

- [Clerk 공식 문서](https://clerk.com/docs)
- [Next.js + Clerk 가이드](https://clerk.com/docs/quickstarts/nextjs)
- [Webhook 가이드](./webhooks.md)
- [API 엔드포인트](./endpoints.md)

---

**마지막 업데이트**: 2025년 11월 9일

