'use client';
// ─────────────────────────────────────────────────────────────────────────────
// VersionWatermark.jsx
//
// 현재 배포된 빌드 ID를 화면 하단에 표시하는 워터마크 컴포넌트.
// buildId prop은 서버 컴포넌트(layout.js)에서 NEXT_PUBLIC_BUILD_ID 환경변수로 주입.
//
// 클릭하면 SW로부터 실시간 빌드 ID도 조회해 일치 여부를 확인할 수 있습니다.
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useRef, useState } from 'react';

export function VersionWatermark({ buildId }) {
  const [swBuildId, setSwBuildId] = useState(null);
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef(null);

  // SW에 현재 빌드 ID 조회
  const querySwBuildId = () => {
    if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller) {
      setSwBuildId('SW 없음');
      return;
    }
    const onMessage = (event) => {
      if (event.data?.type === 'BUILD_ID') {
        setSwBuildId(event.data.buildId);
        navigator.serviceWorker.removeEventListener('message', onMessage);
      }
    };
    navigator.serviceWorker.addEventListener('message', onMessage);
    navigator.serviceWorker.controller.postMessage({ type: 'GET_BUILD_ID' });
  };

  const handleClick = () => {
    setVisible(true);
    querySwBuildId();
    clearTimeout(timeoutRef.current);
    // 8초 후 자동 숨김
    timeoutRef.current = setTimeout(() => setVisible(false), 8000);
  };

  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  const isMatch = swBuildId && swBuildId !== 'SW 없음' && swBuildId === buildId;
  const statusColor = !swBuildId ? 'bg-slate-400' : isMatch ? 'bg-emerald-500' : 'bg-amber-500';
  const displayId = buildId || 'dev';

  return (
    <button
      onClick={handleClick}
      title="빌드 버전 확인"
      className="fixed bottom-2 left-2 z-50 flex items-center gap-1.5 text-[10px] text-slate-400
                 hover:text-slate-600 transition-colors select-none"
      aria-label="빌드 버전 확인"
    >
      {/* 상태 인디케이터 점 */}
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusColor}`} />

      {visible ? (
        <span className="bg-white/90 border border-slate-200 rounded px-1.5 py-0.5 shadow text-slate-600 font-mono">
          {displayId}
          {swBuildId && (
            <span className={`ml-1 ${isMatch ? 'text-emerald-600' : 'text-amber-600'}`}>
              {isMatch ? '✓ 최신' : `⚠ SW: ${swBuildId}`}
            </span>
          )}
        </span>
      ) : (
        <span className="font-mono opacity-50">{displayId.slice(0, 7)}</span>
      )}
    </button>
  );
}
