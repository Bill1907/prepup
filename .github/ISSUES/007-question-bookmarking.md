# 면접 질문 북마크 기능 구현

## 설명
사용자가 중요한 면접 질문을 북마크하고 나중에 쉽게 찾아볼 수 있는 기능을 구현합니다.

## 현재 상태
- 질문 목록 UI에 북마크 아이콘 표시
- 클릭 시 시각적 토글만 동작 (상태 저장 안됨)
- `user_notes` 테이블에 북마크 저장 가능한 구조 존재

## 구현 필요 사항

### Backend API
- [ ] `POST /api/questions/[id]/bookmark` - 북마크 추가
- [ ] `DELETE /api/questions/[id]/bookmark` - 북마크 제거
- [ ] `GET /api/questions/bookmarks` - 북마크된 질문 목록

### Database
`user_notes` 테이블 활용:
```sql
-- 기존 테이블 구조
CREATE TABLE user_notes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  question_id TEXT,
  resume_id TEXT,
  note TEXT,
  is_bookmarked BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Frontend
- [ ] 북마크 토글 시 API 호출
- [ ] 북마크 상태 실시간 반영
- [ ] "북마크만 보기" 필터 추가
- [ ] "내 북마크" 별도 페이지 또는 탭
- [ ] 북마크 추가/제거 시 토스트 알림
- [ ] 북마크 개수 표시

### UX 개선
- [ ] 북마크 버튼 호버 시 툴팁
- [ ] 북마크 목록 정렬 옵션 (최근 추가순, 카테고리별)
- [ ] 북마크에 메모 추가 기능

## 관련 파일
- `app/service/questions/page.tsx`
- `lib/db/schema.ts` (user_notes 테이블)

## 우선순위
**Priority 3 - Data Management**

## Labels
`enhancement`, `frontend`, `backend`
