# API 문서화 완성

## 설명
모든 API 엔드포인트에 대한 상세 문서를 작성합니다.

## 현재 상태
- `docs/api/` 디렉토리 존재
- 대부분의 문서가 비어있거나 미완성
- 실제 API 엔드포인트 12개 이상 존재

## 구현 필요 사항

### API 엔드포인트 문서화

#### Resume API
- [ ] `GET /api/resumes` - 이력서 목록 조회
- [ ] `POST /api/resumes` - 이력서 생성
- [ ] `GET /api/resumes/[id]` - 이력서 상세 조회
- [ ] `PATCH /api/resumes/[id]` - 이력서 수정
- [ ] `DELETE /api/resumes/[id]` - 이력서 삭제
- [ ] `GET /api/resumes/[id]/history` - 버전 히스토리
- [ ] `GET /api/resumes/[id]/download` - 다운로드
- [ ] `POST /api/resumes/upload` - 파일 업로드
- [ ] `POST /api/resumes/upload/presigned-url` - Presigned URL 생성
- [ ] `POST /api/resumes/upload/complete` - 업로드 완료 처리

#### File API
- [ ] `GET /api/files/[...path]` - 파일 조회
- [ ] `GET /api/files/presigned-url` - Presigned URL 생성

#### Webhook API
- [ ] `POST /api/webhooks/clerk` - Clerk 웹훅

### 문서 구조
```markdown
# API 이름

## 개요
간단한 설명

## 인증
필요한 인증 방법

## 요청
### HTTP 메서드 및 경로
### 헤더
### 쿼리 파라미터
### 요청 본문

## 응답
### 성공 응답 (200, 201)
### 에러 응답 (400, 401, 404, 500)

## 예시
### 요청 예시
### 응답 예시

## 에러 코드
| 코드 | 설명 |
|------|------|
```

### 추가 문서
- [ ] 인증 가이드 (Clerk 연동)
- [ ] 에러 코드 레퍼런스
- [ ] Rate Limiting 정책
- [ ] API 버전 관리 정책

### 도구 활용
- OpenAPI/Swagger 스펙 생성 고려
- Postman Collection 제공

## 관련 파일
- `docs/api/endpoints.md` (생성 필요)
- `docs/api/authentication.md` (생성 필요)

## 우선순위
**Priority 4 - Content & Documentation**

## Labels
`documentation`, `api`
