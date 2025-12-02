# 이력서 버전 히스토리 및 비교 기능

## 설명
이력서의 수정 이력을 관리하고, 버전 간 비교 및 롤백 기능을 제공합니다.

## 현재 상태
- `resume_history` 테이블 스키마 존재
- 히스토리 페이지 UI 존재 (`/service/resume/[id]/history`)
- Mock 데이터로 표시
- 버전 비교 기능 미구현

## 구현 필요 사항

### Backend API
- [ ] `GET /api/resumes/[id]/history` - 버전 히스토리 조회 (실제 데이터)
- [ ] `GET /api/resumes/[id]/history/[version]` - 특정 버전 조회
- [ ] `POST /api/resumes/[id]/history/[version]/restore` - 버전 복원
- [ ] 이력서 수정 시 자동으로 히스토리 저장

### Database 트리거
```sql
-- 이력서 수정 시 자동 히스토리 저장
CREATE TRIGGER save_resume_history
AFTER UPDATE ON resumes
BEGIN
  INSERT INTO resume_history (
    id, resume_id, version_number, file_url,
    change_summary, created_at
  ) VALUES (
    lower(hex(randomblob(16))),
    OLD.id,
    (SELECT COALESCE(MAX(version_number), 0) + 1
     FROM resume_history WHERE resume_id = OLD.id),
    OLD.file_url,
    'Auto-saved version',
    datetime('now')
  );
END;
```

### Frontend
- [ ] 버전 타임라인 UI
- [ ] 버전 간 diff 시각화
  - 추가된 내용 (초록색)
  - 삭제된 내용 (빨간색)
  - 수정된 내용 (노란색)
- [ ] Side-by-side 비교 뷰
- [ ] 버전 복원 확인 모달
- [ ] 버전별 AI 분석 점수 변화 그래프

### 히스토리 정보 표시
- 버전 번호
- 수정 일시
- 변경 요약
- AI 점수 변화
- 파일 크기

## 관련 파일
- `app/service/resume/[id]/history/page.tsx`
- `lib/db/schema.ts` (resume_history 테이블)
- `app/api/resumes/[id]/history/route.ts`

## 우선순위
**Priority 3 - Data Management**

## Labels
`enhancement`, `frontend`, `backend`
