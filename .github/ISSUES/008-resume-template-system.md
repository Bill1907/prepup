# 이력서 템플릿 시스템 구현

## 설명
다양한 이력서 템플릿을 선택하고 커스터마이징할 수 있는 기능을 구현합니다.

## 현재 상태
- 템플릿 쇼케이스 UI 존재 (`/service/resume` 페이지 내)
- 4가지 템플릿 표시 (Modern, Classic, Creative, Executive)
- 템플릿 선택/적용 기능 미구현
- 대시보드 "Templates Used" 항상 0으로 표시

## 구현 필요 사항

### Database
```sql
CREATE TABLE resume_templates (
  id TEXT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  template_data JSONB,  -- 템플릿 스타일/레이아웃 정보
  category VARCHAR(50),  -- modern, classic, creative, etc.
  is_premium BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- resumes 테이블에 템플릿 참조 추가
ALTER TABLE resumes ADD COLUMN template_id TEXT REFERENCES resume_templates(id);
```

### Backend API
- [ ] `GET /api/templates` - 템플릿 목록 조회
- [ ] `GET /api/templates/[id]` - 템플릿 상세
- [ ] `POST /api/resumes/[id]/apply-template` - 템플릿 적용
- [ ] `GET /api/users/me/template-usage` - 사용 통계

### Frontend
- [ ] 템플릿 선택 모달/페이지
- [ ] 템플릿 미리보기
- [ ] 템플릿 적용 후 이력서 에디터
- [ ] 템플릿 카테고리 필터
- [ ] Premium 템플릿 잠금 표시

### 템플릿 에디터 기능
- [ ] 섹션 순서 변경 (드래그 앤 드롭)
- [ ] 색상 테마 선택
- [ ] 폰트 선택
- [ ] 여백/간격 조정
- [ ] 실시간 미리보기

### 기본 템플릿
1. **Modern** - 깔끔한 현대적 디자인
2. **Classic** - 전통적인 이력서 형식
3. **Creative** - 크리에이티브 직군용
4. **Executive** - 임원급 이력서

## 관련 파일
- `app/service/resume/page.tsx`
- `app/service/resume/components/`

## 우선순위
**Priority 3 - Data Management**

## Labels
`enhancement`, `frontend`, `backend`, `design`
