# UI 컴포넌트 문서화

## 설명
shadcn/ui 기반 컴포넌트들의 사용법과 패턴을 문서화합니다.

## 현재 상태
- `components/ui/` 디렉토리에 다수의 컴포넌트 존재
- 컴포넌트 가이드라인 문서 부재
- 디자인 시스템 문서 미완성

## 구현 필요 사항

### 컴포넌트 인벤토리 문서화

#### 기본 컴포넌트
- [ ] Button (variants, sizes, states)
- [ ] Input (text, email, password, etc.)
- [ ] Textarea
- [ ] Select
- [ ] Checkbox
- [ ] Radio
- [ ] Switch
- [ ] Slider

#### 레이아웃 컴포넌트
- [ ] Card (header, content, footer)
- [ ] Dialog/Modal
- [ ] Sheet (slide-over panel)
- [ ] Tabs
- [ ] Accordion

#### 데이터 표시
- [ ] Table
- [ ] Badge
- [ ] Avatar
- [ ] Progress
- [ ] Skeleton

#### 피드백
- [ ] Toast
- [ ] Alert
- [ ] Tooltip

#### 네비게이션
- [ ] Navigation Menu
- [ ] Breadcrumb
- [ ] Pagination

### 문서 구조
```markdown
# 컴포넌트 이름

## 개요
컴포넌트 설명

## 설치
import 방법

## Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|

## 사용 예시
### 기본 사용
### Variants
### 조합 패턴

## 접근성
키보드 네비게이션, ARIA 속성

## 관련 컴포넌트
```

### 디자인 시스템 문서
- [ ] 색상 팔레트 (light/dark mode)
- [ ] 타이포그래피 스케일
- [ ] 간격(spacing) 시스템
- [ ] 그림자(shadow) 레벨
- [ ] 반응형 브레이크포인트
- [ ] 아이콘 사용 가이드 (Lucide)

### 패턴 가이드
- [ ] 폼 레이아웃 패턴
- [ ] 카드 그리드 패턴
- [ ] 모달 사용 패턴
- [ ] 로딩 상태 패턴
- [ ] 에러 상태 패턴

## 관련 파일
- `components/ui/`
- `docs/development/components.md` (생성 필요)
- `docs/development/design-system.md` (생성 필요)

## 우선순위
**Priority 4 - Content & Documentation**

## Labels
`documentation`, `design-system`
