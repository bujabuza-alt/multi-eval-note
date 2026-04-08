'use client';
// ─────────────────────────────────────────────────────────────────────────────
// ServiceWorkerUpdater.jsx
//
// SW 등록 + 새 버전 감지 + 업데이트 배너 표시.
// layout.js의 인라인 스크립트를 대체하며, 새 SW가 waiting 상태일 때
// 사용자에게 새로고침 배너를 보여줍니다.
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useState } from 'react';

export function ServiceWorkerUpdater({ swPath }) {
  const [waitingSW, setWaitingSW] = useState(null);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    let registration;

    const onUpdateFound = () => {
      const newWorker = registration.installing;
      if (!newWorker) return;
      newWorker.addEventListener('statechange', () => {
        // 새 SW가 installed(waiting) 상태이고 기존 SW가 활성화 중일 때
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          setWaitingSW(newWorker);
        }
      });
    };

    navigator.serviceWorker
      .register(swPath)
      .then((reg) => {
        registration = reg;
        // 이미 waiting 중인 SW가 있으면 즉시 배너 표시
        if (reg.waiting && navigator.serviceWorker.controller) {
          setWaitingSW(reg.waiting);
        }
        reg.addEventListener('updatefound', onUpdateFound);
        // 주기적으로 업데이트 확인 (30분 간격)
        setInterval(() => reg.update(), 30 * 60 * 1000);
      })
      .catch((err) => console.error('[SW] 등록 실패:', err));

    // 새 SW가 clients.claim()으로 제어권을 가져오면 페이지 자동 새로고침
    const onControllerChange = () => window.location.reload();
    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
      if (registration) registration.removeEventListener('updatefound', onUpdateFound);
    };
  }, [swPath]);

  const handleUpdate = () => {
    if (!waitingSW) return;
    // 대기 중인 SW에 즉시 활성화 요청
    waitingSW.postMessage({ type: 'SKIP_WAITING' });
    setWaitingSW(null);
  };

  if (!waitingSW) return null;

  return (
    <div
      role="alert"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-3
                 bg-indigo-600 text-white text-sm font-medium px-4 py-3 rounded-2xl shadow-xl
                 animate-in slide-in-from-bottom-4 duration-300"
    >
      <span>새 버전이 있습니다!</span>
      <button
        onClick={handleUpdate}
        className="bg-white text-indigo-700 rounded-lg px-3 py-1 text-xs font-bold
                   hover:bg-indigo-50 transition-colors whitespace-nowrap"
      >
        지금 업데이트
      </button>
    </div>
  );
}
