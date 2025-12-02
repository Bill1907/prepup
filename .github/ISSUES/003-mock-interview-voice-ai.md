# 모의 면접 음성 AI 기능 구현

## 설명
실시간 음성 기반 모의 면접 기능을 구현합니다. AI 면접관과 실제 면접처럼 대화하며 연습할 수 있습니다.

## 현재 상태
- 모의 면접 페이지 UI 존재 (`/service/mock-interview`)
- Mock 데이터로 면접 세션 목록 표시
- 데이터베이스 스키마 준비됨 (`mock_interview_sessions`, `interview_answers`)

## 구현 필요 사항

### Backend
- [ ] 음성 AI 서비스 선택 및 연동 (ElevenLabs, OpenAI Whisper, 등)
- [ ] Speech-to-Text (STT) API 연동
- [ ] Text-to-Speech (TTS) API 연동
- [ ] 면접 세션 관리 API
  - `POST /api/mock-interviews` - 세션 시작
  - `POST /api/mock-interviews/[id]/answer` - 답변 제출
  - `POST /api/mock-interviews/[id]/end` - 세션 종료
- [ ] AI 평가 로직 구현 (답변 분석, 점수화)
- [ ] 음성 녹음 파일 R2 저장
- [ ] 실시간 WebSocket 또는 Server-Sent Events 연동

### Frontend
- [ ] 마이크 접근 권한 요청 및 녹음 UI
- [ ] 실시간 면접 대화 인터페이스
- [ ] AI 면접관 음성 재생
- [ ] 답변 녹음 중 시각적 피드백 (웨이브폼)
- [ ] 면접 진행 상태 표시
- [ ] 면접 종료 후 결과 화면
  - 전체 점수
  - 각 질문별 평가
  - 개선 피드백
- [ ] 녹음된 답변 재생 기능

### 면접 유형
- Technical Interview (기술 면접)
- Behavioral Interview (인성 면접)
- System Design (시스템 설계)
- Leadership (리더십)

## 기술적 고려사항
- WebRTC 또는 MediaRecorder API 사용
- 음성 지연 최소화
- 백그라운드 노이즈 제거
- 모바일 환경 지원

## 관련 파일
- `app/service/mock-interview/page.tsx`
- `lib/db/schema.ts` (mock_interview_sessions, interview_answers)

## 우선순위
**Priority 1 - Core Feature**

## Labels
`enhancement`, `ai`, `voice`, `backend`, `frontend`, `complex`
