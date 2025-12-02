# AI 기반 면접 질문 자동 생성 기능 구현

## 설명
이력서 내용을 분석하여 맞춤형 면접 질문을 AI로 자동 생성하는 기능을 구현합니다.

## 현재 상태
- 면접 질문 페이지 UI 존재 (`/service/questions`)
- 하드코딩된 mock 데이터만 사용 중
- 데이터베이스 스키마 준비됨 (`interview_questions` 테이블)

## 구현 필요 사항

### Backend
- [ ] PDF에서 텍스트 추출 기능 구현 (pdf-parse 라이브러리 활용)
- [ ] OpenAI API 연동하여 질문 생성 프롬프트 작성
- [ ] `POST /api/interview-questions/generate` API 엔드포인트 생성
- [ ] 생성된 질문을 `interview_questions` 테이블에 저장
- [ ] 이력서의 직무, 기술 스택, 경력에 따른 질문 카테고리 분류

### Frontend
- [ ] 이력서 선택 후 "질문 생성" 버튼 추가
- [ ] 질문 생성 중 로딩 상태 표시
- [ ] 생성된 질문 목록 실시간 업데이트
- [ ] 질문 필터링 (카테고리, 난이도별)

### 질문 카테고리
- Behavioral (행동 질문)
- Technical (기술 질문)
- System Design (시스템 설계)
- Leadership (리더십)
- Project Experience (프로젝트 경험)

## 관련 파일
- `app/service/questions/page.tsx`
- `lib/db/schema.ts` (interview_questions 테이블)
- `lib/openaiClient.ts`

## 우선순위
**Priority 1 - Core Feature**

## Labels
`enhancement`, `ai`, `backend`, `frontend`
