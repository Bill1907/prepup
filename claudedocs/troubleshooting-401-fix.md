# Fix: R2 File Access Error in Question Generation

## Problem Summary
When attempting to generate interview questions from a resume, the system encountered file access errors:
1. Initial `401 Unauthorized` error
2. After auth fix: `Error: get: Unspecified error (0)` from R2 binding

### Error Details
```
Error: get: Unspecified error (0)
    at async getFile (/Users/boseongkim/development/prepup/.next/dev/server/edge/chunks/[root-of-the-server]__c1aa5c41._.js:129:12)
```

## Root Cause Analysis

### Issue 1: Authentication Flow (Resolved)
1. **Server Action Context**: The `generateQuestionsFromResume()` Server Action runs in Node.js runtime
2. **API Route Dependency**: It tried to fetch files through the Edge API route at `/api/files/[...path]`
3. **Missing Authentication**: The `fetch()` call didn't include authentication credentials
4. **Result**: 401 Unauthorized error

### Issue 2: R2 Binding Not Available in Dev (Main Issue)
1. **Development Environment**: Running `npm run dev` (Next.js dev server)
2. **R2 Binding Issue**: Cloudflare R2 bindings not properly initialized in local development
3. **Remote R2 Configuration**: Even with `remote: true` in wrangler.jsonc, bindings don't work in Next.js dev mode
4. **Result**: "Unspecified error (0)" when trying to access R2 bucket

### Why It Failed
- Next.js dev server (`npm run dev`) doesn't initialize Cloudflare Workers bindings
- R2 binding requires either `wrangler pages dev` or production deployment to work properly
- The Edge runtime in development couldn't access the R2 bucket binding

## Solution Implemented

### 1. Use Presigned URLs Instead of Direct R2 Access
Modified `uploadPdfFromR2()` to generate presigned URLs using R2 credentials:

**[app/actions/question-actions.ts:47-64](../app/actions/question-actions.ts#L47-L64)**
```typescript
async function uploadPdfFromR2(fileKey: string, userId: string): Promise<string> {
  console.log(`[QUESTIONS] Starting PDF upload from R2, fileKey: ${fileKey}`);

  const validation = validateFileKey(fileKey);
  if (!validation.valid) {
    throw new Error(validation.message);
  }

  try {
    // Presigned URL 생성 (5분 만료)
    console.log(`[QUESTIONS] Generating presigned URL for file...`);
    const presignedUrl = await getPresignedUrl(fileKey, 300);
    console.log(`[QUESTIONS] Got presigned URL, fetching file...`);

    // Presigned URL을 사용하여 파일 다운로드
    const response = await fetch(presignedUrl, {
      method: "GET",
    });
    // ...
}
```

### 2. Leverage R2 Credential Fallback
The `getPresignedUrl()` function uses R2 credentials from environment variables:

**[lib/r2/index.ts:95-98](../lib/r2/index.ts#L95-L98)**
```typescript
// Fallback to process.env (works in Server Actions)
accessKeyId = process.env.R2_ACCESS_KEY_ID;
secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
accountId = process.env.R2_ACCOUNT_ID;
```

This works in both local development and production because:
- In Server Actions: Falls back to `process.env`
- In Edge runtime: Uses Cloudflare context or env vars

### 3. Fixed Type Annotations
Corrected the R2 type annotation from `R2Object` to `R2ObjectBody`:

**[lib/r2/index.ts:130](../lib/r2/index.ts#L130)**
```typescript
export async function getFile(fileKey: string): Promise<R2ObjectBody | null> {
  const r2Bucket = getR2Bucket();
  return await r2Bucket.get(fileKey);
}
```

### 4. Fixed Legacy Import
Updated legacy Drizzle import to use GraphQL types:

**[app/service/questions/components/category-grid.tsx:4](../app/service/questions/components/category-grid.tsx#L4)**
```typescript
import type { QuestionCategory } from "@/lib/graphql/queries/questions";
```

## Security Considerations

### Why This Approach is Secure
1. **Presigned URLs with Expiry**: URLs expire after 5 minutes (300 seconds)
2. **AWS Signature v4**: Uses cryptographic signatures to authenticate requests
3. **User Validation**: Resume ownership verified before generating presigned URL
4. **No Direct Bucket Access**: Files accessed through signed URLs only
5. **Credential Security**: R2 credentials stored securely in environment variables

### Benefits of Presigned URL Approach
1. **Works Everywhere**: Functions in local development, Edge runtime, and Node.js Server Actions
2. **No Binding Dependency**: Doesn't require Cloudflare Workers binding setup
3. **Industry Standard**: Uses AWS S3-compatible presigned URL mechanism
4. **Bandwidth Efficient**: Direct download from R2, no proxy through Workers

### Alternative Approaches Considered
1. **Direct R2 Binding Access**: Doesn't work in Next.js dev server (`npm run dev`)
2. **API Route Proxy**: Works but requires R2 binding and adds latency
3. **Presigned URLs** ✅: Chosen for compatibility and efficiency

## Files Changed
- ✅ [app/actions/question-actions.ts](../app/actions/question-actions.ts) - Use presigned URLs instead of API route
- ✅ [lib/r2/index.ts](../lib/r2/index.ts) - Fixed R2ObjectBody type annotation
- ✅ [app/service/questions/components/category-grid.tsx](../app/service/questions/components/category-grid.tsx) - Fixed import path

## Testing Instructions

### 1. Start Development Server
```bash
npm run dev
```

### 2. Test Question Generation
1. Navigate to `/service/questions`
2. Upload a resume (if not already uploaded)
3. Click "Generate Questions" button
4. Verify questions are generated without 401 error

### 3. Verify File Access
1. Check presigned URL generation in logs
2. Verify file download from presigned URL
3. Confirm OpenAI file upload succeeds

### Expected Behavior
- ✅ Authenticated users can generate questions from their own resumes
- ✅ Presigned URLs generated successfully in both dev and production
- ✅ Files downloaded and uploaded to OpenAI without errors
- ✅ Questions generated and saved to database via GraphQL

## Related Documentation
- [Architecture Overview](../CLAUDE.md#architecture-overview)
- [Authentication & Protected Routes](../CLAUDE.md#authentication--protected-routes)
- [Server Actions](../CLAUDE.md#server-actions-appactions)
- [File Storage (Cloudflare R2)](../CLAUDE.md#file-storage-cloudflare-r2)
