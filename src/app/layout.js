import './globals.css';

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
        <link rel="apple-touch-icon" href="/icon.svg" />
      </head>
      <body>
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('${process.env.NEXT_PUBLIC_BASE_PATH || ''}/sw.js');
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
