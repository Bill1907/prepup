#!/bin/bash

# Clerk 환경 변수를 Cloudflare Workers에 설정하는 스크립트
# .env.local 파일에서 값을 읽어와서 Wrangler secrets로 설정합니다

echo "🔐 Setting up Clerk secrets for Cloudflare Workers..."
echo ""

# .env.local 파일이 있는지 확인
if [ ! -f .env.local ]; then
    echo "❌ Error: .env.local file not found!"
    echo "Please create .env.local file with your Clerk credentials first."
    exit 1
fi

# CLERK_SECRET_KEY 읽기
CLERK_SECRET_KEY=$(grep "^CLERK_SECRET_KEY=" .env.local | cut -d '=' -f2)
if [ -z "$CLERK_SECRET_KEY" ]; then
    echo "❌ Error: CLERK_SECRET_KEY not found in .env.local"
    exit 1
fi

# CLERK_WEBHOOK_SECRET 읽기
CLERK_WEBHOOK_SECRET=$(grep "^CLERK_WEBHOOK_SECRET=" .env.local | cut -d '=' -f2)
if [ -z "$CLERK_WEBHOOK_SECRET" ]; then
    echo "❌ Error: CLERK_WEBHOOK_SECRET not found in .env.local"
    exit 1
fi

# NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY 읽기
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$(grep "^NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=" .env.local | cut -d '=' -f2)
if [ -z "$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY" ]; then
    echo "❌ Error: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY not found in .env.local"
    exit 1
fi

echo "📝 Found Clerk credentials in .env.local"
echo ""

# Wrangler secrets 설정
echo "1️⃣ Setting CLERK_SECRET_KEY..."
echo "$CLERK_SECRET_KEY" | npx wrangler secret put CLERK_SECRET_KEY

echo ""
echo "2️⃣ Setting CLERK_WEBHOOK_SECRET..."
echo "$CLERK_WEBHOOK_SECRET" | npx wrangler secret put CLERK_WEBHOOK_SECRET

echo ""
echo "3️⃣ Setting NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY..."
echo "$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY" | npx wrangler secret put NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

echo ""
echo "✅ All Clerk secrets have been set successfully!"
echo ""
echo "You can verify by running: npx wrangler secret list"
echo ""
echo "Next steps:"
echo "1. Run: npm run deploy"
echo "2. Test your application"

