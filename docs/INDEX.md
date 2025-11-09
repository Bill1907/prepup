# 📚 PrepUp 문서 전체 인덱스

모든 문서를 알파벳순 / 카테고리별로 정리한 인덱스입니다.

## 🗂️ 카테고리별 문서

### 데이터베이스 (Database)
| 문서 | 설명 | 난이도 |
|------|------|--------|
| [quick-start.md](./database/quick-start.md) | 5분 안에 D1 & R2 시작하기 | ⭐ 초급 |
| [setup.md](./database/setup.md) | D1과 R2 상세 설정 가이드 | ⭐⭐ 중급 |
| [schema.md](./database/schema.md) | 데이터베이스 스키마 전체 문서 | ⭐⭐ 중급 |
| [queries.md](./database/queries.md) | 자주 사용하는 쿼리 예제 | ⭐⭐ 중급 |
| [migration.md](./database/migration.md) | 마이그레이션 가이드 | ⭐⭐⭐ 고급 |

### API & 인증 (API & Authentication)
| 문서 | 설명 | 난이도 |
|------|------|--------|
| [authentication.md](./api/authentication.md) | Clerk 인증 설정 및 사용법 | ⭐⭐ 중급 |
| endpoints.md | API 엔드포인트 문서 | ⭐⭐ 중급 |
| webhooks.md | Webhook 설정 가이드 | ⭐⭐⭐ 고급 |

### 배포 (Deployment)
| 문서 | 설명 | 난이도 |
|------|------|--------|
| [cloudflare.md](./deployment/cloudflare.md) | Cloudflare Workers 배포 | ⭐⭐⭐ 고급 |
| environment.md | 환경 변수 관리 | ⭐⭐ 중급 |
| cicd.md | CI/CD 파이프라인 설정 | ⭐⭐⭐ 고급 |

### 개발 (Development)
| 문서 | 설명 | 난이도 |
|------|------|--------|
| [getting-started.md](./development/getting-started.md) | 개발 환경 구축 | ⭐ 초급 |
| environment.md | 로컬 개발 환경 설정 | ⭐ 초급 |
| guidelines.md | 코딩 가이드라인 | ⭐⭐ 중급 |
| components.md | 컴포넌트 구조 | ⭐⭐ 중급 |
| state-management.md | 상태 관리 패턴 | ⭐⭐⭐ 고급 |

### 가이드 (Guides)
| 문서 | 설명 | 난이도 |
|------|------|--------|
| [korean-guide.md](./guides/korean-guide.md) | 완전한 한국어 가이드 | ⭐ 초급 |
| design-system.md | 디자인 시스템 | ⭐⭐ 중급 |
| shadcn-ui.md | shadcn/ui 사용법 | ⭐⭐ 중급 |
| responsive-design.md | 반응형 디자인 | ⭐⭐ 중급 |

### 기능 (Features)
| 문서 | 설명 | 난이도 |
|------|------|--------|
| resume-management.md | 이력서 관리 기능 | ⭐⭐ 중급 |
| interview-questions.md | 질문 관리 기능 | ⭐⭐ 중급 |
| mock-interview.md | 모의 인터뷰 기능 | ⭐⭐⭐ 고급 |
| subscription.md | 구독 & 결제 시스템 | ⭐⭐⭐ 고급 |

### 아키텍처 (Architecture)
| 문서 | 설명 | 난이도 |
|------|------|--------|
| overview.md | 시스템 아키텍처 개요 | ⭐⭐⭐ 고급 |
| folder-structure.md | 폴더 구조 설명 | ⭐ 초급 |
| data-flow.md | 데이터 플로우 | ⭐⭐⭐ 고급 |

---

## 🎯 사용자 여정별 문서

### 처음 시작하는 개발자
1. [개발 환경 구축](./development/getting-started.md)
2. [한국어 가이드](./guides/korean-guide.md)
3. [데이터베이스 빠른 시작](./database/quick-start.md)
4. [Clerk 인증 설정](./api/authentication.md)

### 백엔드 개발자
1. [데이터베이스 스키마](./database/schema.md)
2. [쿼리 예제](./database/queries.md)
3. [API 엔드포인트 설계](./api/endpoints.md)
4. [Webhook 설정](./api/webhooks.md)

### 프론트엔드 개발자
1. [컴포넌트 구조](./development/components.md)
2. [디자인 시스템](./guides/design-system.md)
3. [shadcn/ui 가이드](./guides/shadcn-ui.md)
4. [상태 관리](./development/state-management.md)

### DevOps / 배포 담당자
1. [Cloudflare 배포](./deployment/cloudflare.md)
2. [환경 변수 관리](./deployment/environment.md)
3. [CI/CD 설정](./deployment/cicd.md)
4. [모니터링 설정](./deployment/monitoring.md)

---

## 🔍 주제별 검색

### 데이터베이스 관련
- **D1 설정**: [setup.md](./database/setup.md)
- **스키마 설계**: [schema.md](./database/schema.md)
- **쿼리 작성**: [queries.md](./database/queries.md)
- **마이그레이션**: [migration.md](./database/migration.md)

### 인증 관련
- **Clerk 설정**: [authentication.md](./api/authentication.md)
- **보호된 라우트**: [authentication.md#보호된-라우트](./api/authentication.md#보호된-라우트)
- **Webhook**: [webhooks.md](./api/webhooks.md)

### 배포 관련
- **Cloudflare 배포**: [cloudflare.md](./deployment/cloudflare.md)
- **환경 변수**: [environment.md](./deployment/environment.md)
- **CI/CD**: [cicd.md](./deployment/cicd.md)

### UI/UX 관련
- **디자인 시스템**: [design-system.md](./guides/design-system.md)
- **컴포넌트**: [components.md](./development/components.md)
- **반응형**: [responsive-design.md](./guides/responsive-design.md)

---

## 📊 문서 통계

- **전체 문서 수**: 25+
- **초급 문서**: 5개
- **중급 문서**: 12개
- **고급 문서**: 8개

---

## 🆕 최근 추가된 문서

- [2025-11-09] [database/queries.md](./database/queries.md) - 쿼리 예제 추가
- [2025-11-09] [database/schema.md](./database/schema.md) - 스키마 문서화
- [2025-11-09] [api/authentication.md](./api/authentication.md) - Clerk 인증 가이드
- [2025-11-09] [deployment/cloudflare.md](./deployment/cloudflare.md) - 배포 가이드
- [2025-11-09] [development/getting-started.md](./development/getting-started.md) - 시작 가이드

---

## 📝 문서 작성 예정

다음 문서들이 작성 예정입니다:

- [ ] API 엔드포인트 상세 문서
- [ ] Webhook 구현 가이드
- [ ] CI/CD 파이프라인 설정
- [ ] 환경 변수 관리 가이드
- [ ] 컴포넌트 구조 문서
- [ ] 상태 관리 패턴
- [ ] 디자인 시스템
- [ ] 이력서 관리 기능
- [ ] 인터뷰 질문 기능
- [ ] 모의 인터뷰 기능
- [ ] 구독 & 결제 시스템

---

## 🔗 외부 리소스

### 공식 문서
- [Next.js 문서](https://nextjs.org/docs)
- [Cloudflare Workers 문서](https://developers.cloudflare.com/workers/)
- [Cloudflare D1 문서](https://developers.cloudflare.com/d1/)
- [Cloudflare R2 문서](https://developers.cloudflare.com/r2/)
- [Clerk 문서](https://clerk.com/docs)
- [shadcn/ui 문서](https://ui.shadcn.com/)

### 학습 리소스
- [React 공식 문서](https://react.dev/)
- [TypeScript 핸드북](https://www.typescriptlang.org/docs/)
- [Tailwind CSS 문서](https://tailwindcss.com/docs)

---

## 🤝 문서에 기여하기

새로운 문서를 작성하거나 기존 문서를 개선하고 싶으시다면:

1. `docs/` 폴더에서 적절한 카테고리 선택
2. 마크다운 파일 생성
3. 이 인덱스 파일 업데이트
4. Pull Request 제출

### 문서 작성 가이드
- 제목은 명확하고 구체적으로
- 코드 예제는 실제 동작하는 코드로
- 스크린샷이나 다이어그램 추가 권장
- 관련 문서 링크 포함
- 난이도 표시 (⭐ 초급, ⭐⭐ 중급, ⭐⭐⭐ 고급)

---

**문서 인덱스 마지막 업데이트**: 2025년 11월 9일

