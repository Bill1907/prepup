# 설정 페이지 기능 구현

## 설명
현재 UI만 존재하는 설정 페이지에 실제 데이터 저장/불러오기 기능을 구현합니다.

## 현재 상태
- 설정 페이지 UI 완성 (`/service/settings`)
- 프로필, 언어, 알림, 구독, 개인정보 섹션 존재
- 폼 제출 핸들러 미구현
- API 엔드포인트 없음

## 구현 필요 사항

### Backend API 엔드포인트
- [ ] `GET /api/users/me` - 현재 사용자 정보 조회
- [ ] `PATCH /api/users/me` - 프로필 업데이트
- [ ] `GET /api/users/me/preferences` - 설정 조회
- [ ] `PATCH /api/users/me/preferences` - 설정 업데이트
- [ ] `POST /api/users/me/export` - 데이터 내보내기
- [ ] `DELETE /api/users/me` - 계정 삭제

### Database
- [ ] `user_preferences` 테이블 추가 또는 `users` 테이블 확장
  ```sql
  language VARCHAR(10) DEFAULT 'ko',
  email_notifications BOOLEAN DEFAULT true,
  push_notifications BOOLEAN DEFAULT true,
  marketing_emails BOOLEAN DEFAULT false,
  timezone VARCHAR(50),
  theme VARCHAR(20) DEFAULT 'system'
  ```

### Frontend
- [ ] 프로필 수정 폼 제출 핸들러
- [ ] 언어 변경 시 즉시 적용
- [ ] 알림 설정 토글 동작
- [ ] 저장 성공/실패 토스트 알림
- [ ] 데이터 내보내기 다운로드 처리
- [ ] 계정 삭제 확인 모달

### 프로필 설정
- [ ] 이름 변경
- [ ] 전화번호 변경
- [ ] 프로필 이미지 업로드

### 알림 설정
- [ ] 이메일 알림 on/off
- [ ] 푸시 알림 on/off
- [ ] 마케팅 이메일 수신 동의

## 관련 파일
- `app/service/settings/page.tsx`
- `lib/db/schema.ts`

## 우선순위
**Priority 1 - Core Feature**

## Labels
`enhancement`, `backend`, `frontend`
