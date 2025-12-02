# PrepUp GitHub Issues

이 디렉토리에는 PrepUp 프로젝트의 개선사항 및 추가 기능에 대한 이슈 템플릿이 포함되어 있습니다.

## 이슈 목록

### Priority 1 - Core Features (핵심 기능)
| # | 제목 | 설명 |
|---|------|------|
| 001 | [AI 기반 면접 질문 자동 생성](./001-ai-interview-question-generation.md) | 이력서 분석 후 맞춤형 면접 질문 생성 |
| 002 | [이력서 분석 파이프라인 완성](./002-complete-resume-analysis-pipeline.md) | PDF 파싱 및 AI 분석 기능 완성 |
| 003 | [모의 면접 음성 AI](./003-mock-interview-voice-ai.md) | 실시간 음성 기반 모의 면접 |
| 004 | [설정 페이지 기능 구현](./004-settings-page-functionality.md) | 프로필, 알림, 구독 설정 저장 |

### Priority 2 - Payment & Email (결제 및 이메일)
| # | 제목 | 설명 |
|---|------|------|
| 005 | [결제 시스템 구현](./005-payment-processing.md) | Stripe/Toss 연동 구독 결제 |
| 006 | [이메일 서비스 구현](./006-email-service.md) | 트랜잭션 이메일, 뉴스레터 |

### Priority 3 - Data Management (데이터 관리)
| # | 제목 | 설명 |
|---|------|------|
| 007 | [질문 북마크 기능](./007-question-bookmarking.md) | 면접 질문 저장 및 관리 |
| 008 | [이력서 템플릿 시스템](./008-resume-template-system.md) | 템플릿 선택 및 커스터마이징 |
| 009 | [이력서 버전 히스토리](./009-resume-history-comparison.md) | 버전 관리 및 비교 기능 |

### Priority 4 - Content & Documentation (콘텐츠 및 문서)
| # | 제목 | 설명 |
|---|------|------|
| 010 | [블로그 모듈](./010-blog-module.md) | 면접 팁, 가이드 콘텐츠 |
| 011 | [API 문서화](./011-api-documentation.md) | 전체 API 엔드포인트 문서화 |
| 012 | [컴포넌트 문서화](./012-component-documentation.md) | UI 컴포넌트 가이드 |

### Priority 5 - Quality & Testing (품질 및 테스트)
| # | 제목 | 설명 |
|---|------|------|
| 013 | [디버그 로깅 정리](./013-remove-debug-logging.md) | 프로덕션 로깅 시스템 구축 |
| 014 | [자동화 테스트](./014-automated-testing.md) | 유닛/E2E 테스트 구축 |
| 015 | [에러 처리 개선](./015-error-handling.md) | 에러 바운더리 및 모니터링 |

## 사용 방법

각 마크다운 파일의 내용을 GitHub Issues에 복사하여 새 이슈를 생성하세요.

### GitHub CLI 사용 시
```bash
gh issue create --title "제목" --body-file .github/ISSUES/001-xxx.md --label "enhancement"
```

## 우선순위 설명

- **Priority 1**: MVP에 필수적인 핵심 기능
- **Priority 2**: 수익화에 필요한 기능
- **Priority 3**: 사용자 경험 개선 기능
- **Priority 4**: 콘텐츠 및 문서화
- **Priority 5**: 코드 품질 및 유지보수

## 예상 개발 로드맵

```
Phase 1: Priority 1 완료 (핵심 기능)
    ↓
Phase 2: Priority 2 완료 (결제 시스템)
    ↓
Phase 3: Priority 3-4 병행 (기능 개선 + 문서화)
    ↓
Phase 4: Priority 5 완료 (품질 향상)
    ↓
Production Ready MVP
```
