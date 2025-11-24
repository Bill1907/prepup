# PrepUp - AI-Powered Interview Preparation Platform

PrepUp is a comprehensive interview preparation platform that uses AI to help job seekers ace their interviews. Get personalized resume feedback, practice with AI-powered mock interviews, and prepare for your dream job with confidence.

## 📚 **[📖 전체 문서 보기 (docs/)](./docs/)**

> 모든 상세 가이드, API 문서, 배포 가이드는 `docs/` 폴더에서 확인하세요!

## 🚀 Features

### 1. Landing Page

- Hero section with value proposition
- Feature overview (Resume, Interview Questions, Mock Interview)
- CTA buttons (Sign Up, Try Demo)
- Pricing section (Free, Pro, Enterprise)
- FAQ section with common questions
- Stats showcase
- Newsletter signup

### 2. Authentication

- Sign Up page with Clerk integration
- Login page
- Password reset functionality
- Email verification
- Protected routes for dashboard

### 3. User Dashboard

- Overview dashboard with quick access to features
- User profile and settings
- Usage statistics and progress tracking
- Recent activity feed
- Upcoming sessions calendar
- Weekly progress metrics

### 4. Resume Management Module

- Resume upload/editor page
- AI-powered feedback and suggestions
- ATS optimization scoring
- Resume versioning and history
- Multiple professional templates
- Export to PDF functionality
- Version comparison

### 5. Interview Preparation Module

- AI-powered interview question generator (resume-based)
- Question library with categories:
  - Behavioral
  - Technical
  - System Design
  - Leadership
  - Problem Solving
  - Company Specific
- Answer tips and frameworks (STAR method)
- Bookmarking and note-taking features
- Practice tracking

### 6. Mock Interview Module (Voice AI)

- Voice AI interviewer integration
- Real-time conversation page
- Multiple interview types:
  - Technical Interview
  - Behavioral Interview
  - System Design
  - Leadership Interview
- Recording and playback functionality
- AI evaluation and feedback on responses
- Session history and progress tracking
- Performance insights dashboard

### 7. User Settings & Account Management

- Profile settings (name, email, language preferences, timezone)
- Current role and target role configuration
- Subscription management and billing
- Payment method management
- Billing history
- Privacy and data settings
- Notification preferences
- Account deletion and data export

### 8. Additional Pages

- **About Us**: Company story, values, team, impact stats
- **Terms of Service**: Complete legal terms
- **Privacy Policy**: Comprehensive privacy information
- **Contact Us**: Contact form with office information
- **Blog**: Articles on interview tips, career advice, industry insights
- **Help Center**: FAQ, knowledge base, popular articles
- **Error Pages**: Custom 404 and error pages
- **Demo Page**: Try features without signing up

## 🛠️ Tech Stack

- **Framework**: Next.js 15.4.6 with App Router
- **UI Library**: React 19.1.0
- **Styling**: Tailwind CSS 4 with custom configuration
- **Components**: shadcn/ui (New York style)
- **Authentication**: Clerk
- **Deployment**: Cloudflare (with OpenNext)
- **Language**: TypeScript
- **Icons**: Lucide React

## 📦 Project Structure

```
prepup/
├── app/
│   ├── about/page.tsx                  # About page
│   ├── auth/
│   │   ├── sign-in/page.tsx           # Sign in page
│   │   └── sign-up/page.tsx           # Sign up page
│   ├── blog/page.tsx                   # Blog listing
│   ├── contact/page.tsx                # Contact form
│   ├── dashboard/
│   │   ├── page.tsx                   # Dashboard home
│   │   ├── resume/
│   │   │   ├── page.tsx               # Resume management
│   │   │   └── upload/page.tsx        # Resume upload
│   │   ├── questions/page.tsx         # Interview questions
│   │   ├── mock-interview/page.tsx    # Mock interviews
│   │   └── settings/page.tsx          # User settings
│   ├── demo/page.tsx                   # Demo features
│   ├── help/page.tsx                   # Help center
│   ├── privacy/page.tsx                # Privacy policy
│   ├── terms/page.tsx                  # Terms of service
│   ├── error.tsx                       # Error page
│   ├── not-found.tsx                   # 404 page
│   ├── layout.tsx                      # Root layout
│   ├── page.tsx                        # Landing page
│   └── globals.css                     # Global styles
├── components/
│   ├── ui/                             # shadcn/ui components
│   ├── navigation.tsx                  # Main navigation
│   └── footer.tsx                      # Footer component
├── lib/
│   └── utils.ts                        # Utility functions
├── middleware.ts                       # Clerk middleware
└── package.json                        # Dependencies

```

## 🚀 빠른 시작

```bash
# 1. 의존성 설치
npm install

# 2. 환경 변수 설정 (.dev.vars 파일 생성)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_key
CLERK_SECRET_KEY=your_secret

# 3. 로컬 데이터베이스 설정
npx wrangler d1 execute prepup-db --local --file=./schema.sql

# 4. 개발 서버 실행
npm run dev
```

**상세 가이드**: [개발 시작하기](./docs/development/getting-started.md)

## 📝 Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run deploy` - Build and deploy to Cloudflare
- `npm run preview` - Preview Cloudflare build
- `npm run cf-typegen` - Generate Cloudflare types

## 🎨 UI Components

The project uses shadcn/ui components with the following installed:

- Button, Card, Input, Textarea
- Accordion, Tabs, Badge, Avatar
- Select, Dropdown Menu, Dialog
- Separator, Label, Checkbox
- Radio Group, Slider, Progress, Switch

## 🔐 Authentication

Authentication is handled by Clerk with the following routes protected:

- `/dashboard/*` - All dashboard routes require authentication

## 🌐 Deployment

The project is configured for deployment on Cloudflare using OpenNext:

```bash
npm run deploy
```

## 📚 주요 문서

### 시작하기

- [개발 환경 설정](./docs/development/getting-started.md) - 로컬 개발 환경 구축
- [한글 가이드](./docs/guides/korean-guide.md) - 완전한 한국어 가이드

### 데이터베이스

- [데이터베이스 빠른 시작](./docs/database/quick-start.md) - 5분 안에 D1 & R2 설정
- [데이터베이스 스키마](./docs/database/schema.md) - 전체 스키마 문서
- [쿼리 예제](./docs/database/queries.md) - 자주 사용하는 쿼리
- [마이그레이션 가이드](./docs/database/migration.md) - 데이터베이스 마이그레이션

### API & 인증

- [Clerk 인증 설정](./docs/api/authentication.md) - Clerk 통합 가이드
- [API 엔드포인트](./docs/api/endpoints.md) - REST API 문서

### 배포

- [Cloudflare 배포](./docs/deployment/cloudflare.md) - Cloudflare Workers 배포 가이드
- [환경 변수 관리](./docs/deployment/environment.md) - 환경 변수 설정

## 📄 환경 변수

필수 환경 변수:

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk 공개 키
- `CLERK_SECRET_KEY` - Clerk 비밀 키
- `CLERK_WEBHOOK_SECRET` - Clerk Webhook 시크릿

**상세 정보**: [환경 변수 가이드](./docs/deployment/environment.md)

## 🎯 Key Features Implementation

### Mock Data

All pages currently use mock data for demonstration purposes. In production, these would be replaced with actual API calls to your backend services.

### Protected Routes

The middleware protects all `/dashboard/*` routes, requiring authentication before access.

### Responsive Design

All pages are fully responsive and work on mobile, tablet, and desktop devices.

### Dark Mode Support

The application supports dark mode through Tailwind's dark mode configuration.

## 🤝 Contributing

This is a demo project. For production use, consider:

- Implementing actual API endpoints
- Adding real AI integration
- Setting up a database
- Implementing file upload functionality
- Adding payment processing
- Setting up email services

## 📧 Support

For support, email support@prepup.com or visit the Help Center.

## 📜 License

All rights reserved © 2025 PrepUp

---

Built with ❤️ using Next.js and Clerk
