# PrepUp 문서

PrepUp 프로젝트의 모든 문서를 한 곳에서 확인할 수 있습니다.

## 📚 문서 구조

### 🚀 시작하기
- [프로젝트 개요](../README.md) - 프로젝트 소개 및 기본 정보
- [한글 가이드](./guides/korean-guide.md) - 한국어 전체 가이드
- [빠른 시작](./development/getting-started.md) - 5분 안에 시작하기

### 💾 데이터베이스
- [데이터베이스 빠른 시작](./database/quick-start.md) - D1 & R2 빠른 시작
- [데이터베이스 설정 가이드](./database/setup.md) - D1 & R2 상세 설정
- [스키마 문서](./database/schema.md) - 데이터베이스 스키마 설명
- [마이그레이션 가이드](./database/migration.md) - 데이터베이스 마이그레이션
- [쿼리 예제](./database/queries.md) - 자주 사용하는 쿼리들

### 🔐 인증 & API
- [Clerk 인증 설정](./api/authentication.md) - Clerk 통합 가이드
- [API 엔드포인트](./api/endpoints.md) - REST API 문서
- [Webhook 설정](./api/webhooks.md) - Clerk Webhook 설정

### 🚢 배포
- [Cloudflare 배포](./deployment/cloudflare.md) - Cloudflare Workers 배포
- [환경 변수 설정](./deployment/environment.md) - 환경 변수 관리
- [CI/CD 설정](./deployment/cicd.md) - 자동 배포 파이프라인

### 💻 개발
- [개발 환경 설정](./development/environment.md) - 로컬 개발 환경
- [코딩 가이드라인](./development/guidelines.md) - 코드 스타일 및 규칙
- [컴포넌트 구조](./development/components.md) - UI 컴포넌트 구조
- [상태 관리](./development/state-management.md) - 상태 관리 패턴

### 🎨 UI/UX
- [디자인 시스템](./guides/design-system.md) - 색상, 타이포그래피, 스페이싱
- [shadcn/ui 가이드](./guides/shadcn-ui.md) - shadcn/ui 사용법
- [반응형 디자인](./guides/responsive-design.md) - 반응형 구현 가이드

### 🔧 기능별 가이드
- [이력서 관리](./features/resume-management.md) - 이력서 기능 구현
- [인터뷰 질문](./features/interview-questions.md) - 질문 관리 기능
- [모의 인터뷰](./features/mock-interview.md) - 모의 인터뷰 기능
- [구독 & 결제](./features/subscription.md) - Toss Payments 통합

### 📊 아키텍처
- [시스템 아키텍처](./architecture/overview.md) - 전체 시스템 구조
- [폴더 구조](./architecture/folder-structure.md) - 프로젝트 폴더 구조
- [데이터 플로우](./architecture/data-flow.md) - 데이터 흐름도

## 🔍 빠른 링크

### 자주 찾는 문서
- [데이터베이스 빠른 시작](./database/quick-start.md) ⚡
- [API 엔드포인트](./api/endpoints.md) 🔌
- [환경 변수 설정](./deployment/environment.md) ⚙️
- [Cloudflare 배포](./deployment/cloudflare.md) 🚀

### 코드 예제
- [인증 예제](./api/authentication.md#예제-코드)
- [데이터베이스 쿼리](./database/queries.md)
- [파일 업로드](./database/setup.md#r2-스토리지-사용-예제)
- [Webhook 처리](./api/webhooks.md#webhook-handler)

## 📝 문서 작성 가이드

새로운 문서를 작성할 때는 다음 템플릿을 사용하세요:

```markdown
# 문서 제목

간단한 설명 (1-2문장)

## 목차
- [섹션 1](#섹션-1)
- [섹션 2](#섹션-2)

## 섹션 1

내용...

### 코드 예제

\`\`\`typescript
// 예제 코드
\`\`\`

## 관련 문서
- [관련 문서 1](./path/to/doc.md)
- [관련 문서 2](./path/to/doc.md)
```

## 🤝 기여하기

문서에 기여하고 싶으시다면:

1. 문서에 오류나 개선사항을 발견하면 이슈를 생성하세요
2. 새로운 문서를 작성하거나 기존 문서를 개선하세요
3. Pull Request를 제출하세요

## 📞 도움이 필요하신가요?

- 📧 Email: support@prepup.com
- 💬 Discord: [PrepUp Community](https://discord.gg/prepup)
- 🐛 Issues: [GitHub Issues](https://github.com/prepup/prepup/issues)

---

**마지막 업데이트**: 2025년 11월 9일

