import './globals.css';
import { ServiceWorkerUpdater } from '@/components/ServiceWorkerUpdater';
import { VersionWatermark } from '@/components/VersionWatermark';

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
const buildId = process.env.NEXT_PUBLIC_BUILD_ID || 'dev';

export const metadata = {
  title: '멀티 평가 노트',
  description: '좋아하는 모든 것을 기록하고 평가하는 노트',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '평가노트',
  },
};

export const viewport = {
  themeColor: '#6366F1',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <head>
        <link rel="apple-touch-icon" href={`${basePath}/apple-touch-icon.png`} />
        <link rel="icon" type="image/png" sizes="192x192" href={`${basePath}/icon-192.png`} />
        <link rel="icon" type="image/png" sizes="512x512" href={`${basePath}/icon-512.png`} />
      </head>
      <body>
        {children}
        {/* SW 등록 + 새 버전 감지 배너 */}
        <ServiceWorkerUpdater swPath={`${basePath}/sw.js`} />
        {/* 빌드 ID 워터마크 (하단 좌측, 클릭 시 SW 버전 대조) */}
        <VersionWatermark buildId={buildId} />
      </body>
    </html>
  );
}
