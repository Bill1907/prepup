# 이력서 분석 파이프라인 완성

## 설명
업로드된 이력서(PDF)를 자동으로 분석하고 ATS 점수, 개선사항, 강점 등을 제공하는 기능을 완성합니다.

## 현재 상태
- 이력서 업로드 기능 존재 (`/api/resumes/upload`)
- R2 스토리지 연동 완료
- `resumes` 테이블에 `ai_feedback`, `score` 필드 존재
- OpenAI 클라이언트 설정됨 (`lib/openaiClient.ts`)
- 분석 결과 표시 UI 일부 구현됨

## 구현 필요 사항

### Backend
- [ ] PDF 텍스트 추출 로직 구현
- [ ] OpenAI GPT 연동하여 이력서 분석 프롬프트 작성
- [ ] ATS 점수 계산 알고리즘 구현
- [ ] 분석 결과 JSON 구조 정의
  ```typescript
  interface AIFeedback {
    score: number;
    summary: string;
    strengths: string[];
    improvements: string[];
    keywords: string[];
    atsCompatibility: {
      score: number;
      issues: string[];
    };
  }
  ```
- [ ] `POST /api/resumes/[id]/analyze` 엔드포인트 생성
- [ ] 업로드 완료 시 자동 분석 트리거

### Frontend
- [ ] 분석 진행 상태 표시 (프로그레스 바)
- [ ] 분석 결과 상세 표시 UI 개선
- [ ] 점수 시각화 (게이지, 차트)
- [ ] 개선사항 체크리스트 형태로 표시
- [ ] "재분석" 버튼 추가

## 관련 파일
- `app/api/resumes/upload/complete/route.ts`
- `app/service/resume/[id]/page.tsx`
- `app/service/resume/components/AIFeedbackDisplay.tsx`
- `lib/db/schema.ts`

## 우선순위
**Priority 1 - Core Feature**

## Labels
`enhancement`, `ai`, `backend`, `frontend`
