const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath,
  assetPrefix: basePath,
  images: { unoptimized: true },
  // 빌드마다 고유 ID 생성: GitHub Actions에서 BUILD_ID 환경변수 주입,
  // 로컬 개발 시에는 타임스탬프 사용
  generateBuildId: async () => {
    return process.env.BUILD_ID || `local-${Date.now()}`;
  },
};

export default nextConfig;
