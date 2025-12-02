# 블로그 모듈 구현

## 설명
면접 팁, 이력서 작성 가이드 등 콘텐츠를 제공하는 블로그 기능을 구현합니다.

## 현재 상태
- 블로그 목록 페이지 존재 (`/blog`)
- 하드코딩된 샘플 포스트 표시
- 블로그 상세 페이지 미구현
- CMS 연동 없음

## 구현 필요 사항

### CMS 선택
- 추천: Contentful, Sanity, 또는 MDX 파일 기반
- 정적 생성(SSG) 활용 권장

### Database (자체 구현 시)
```sql
CREATE TABLE blog_posts (
  id TEXT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  cover_image TEXT,
  author_name VARCHAR(100),
  author_avatar TEXT,
  category VARCHAR(50),
  tags TEXT,  -- JSON array
  reading_time INTEGER,
  published_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_published BOOLEAN DEFAULT false
);

CREATE TABLE blog_categories (
  id TEXT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT
);
```

### Backend API
- [ ] `GET /api/blog/posts` - 포스트 목록 (페이지네이션)
- [ ] `GET /api/blog/posts/[slug]` - 포스트 상세
- [ ] `GET /api/blog/categories` - 카테고리 목록
- [ ] `GET /api/blog/posts/search` - 검색

### Frontend
- [ ] 블로그 목록 페이지 개선
  - 페이지네이션
  - 카테고리 필터
  - 검색 기능
- [ ] 블로그 상세 페이지 (`/blog/[slug]`)
  - Markdown 렌더링
  - 목차 (TOC)
  - 공유 버튼
  - 관련 포스트
- [ ] 카테고리별 필터링
- [ ] 태그 클라우드

### 콘텐츠 카테고리
- 면접 준비 팁
- 이력서 작성 가이드
- 기술 면접 대비
- 커리어 조언
- 채용 트렌드

### SEO 최적화
- [ ] 메타 태그 동적 생성
- [ ] Open Graph 이미지
- [ ] Sitemap 포함
- [ ] Schema.org 마크업

## 관련 파일
- `app/blog/page.tsx`
- 신규: `app/blog/[slug]/page.tsx`

## 우선순위
**Priority 4 - Content & Documentation**

## Labels
`enhancement`, `frontend`, `content`, `seo`
