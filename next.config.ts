import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Removed pdfjs-dist from serverExternalPackages since we're using it client-side only
  // Turbopack configuration for Next.js 16+
  // Empty config to silence the Turbopack warning
  turbopack: {},
  // Keep webpack config for backwards compatibility when using --webpack flag
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    return config;
  },
};

export default nextConfig;

// added by create cloudflare to enable calling `getCloudflareContext()` in `next dev`
// wrangler.jsonc를 읽어서 원격 D1 및 R2 바인딩을 로컬 개발 환경에서도 사용할 수 있도록 설정
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev({
  configPath: "./wrangler.jsonc",
  // wrangler.jsonc의 remote: true 설정을 따라 원격 D1/R2 사용
});
