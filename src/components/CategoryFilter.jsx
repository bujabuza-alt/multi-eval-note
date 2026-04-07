'use client';
// ──────────────────────────────────────────────────────────────────────────────
// components/CategoryFilter.jsx
// 장르 필터 탭 컴포넌트 (구 카테고리 필터).
// - 정적 CATEGORIES 대신 useGenres() 훅의 동적 genres를 사용합니다.
// - '전체' 탭 + 각 장르 탭을 수평 스크롤 형태로 렌더링합니다.
// - 노트 개수(counts)를 각 탭에 뱃지로 표시합니다.
// ──────────────────────────────────────────────────────────────────────────────
import { useGenres } from '@/hooks/useGenres';

export function CategoryFilter({ selected, onSelect, counts }) {
  // 동적 장르 목록 사용
  const { genres } = useGenres();

  // '전체' 탭은 항상 첫 번째에 표시
  const tabs = [{ id: 'all', label: '전체', emoji: '📋' }, ...genres];

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      {tabs.map((genre) => {
        // 전체 탭이면 모든 카운트의 합, 아니면 해당 장르 카운트
        const count =
          genre.id === 'all'
            ? Object.values(counts).reduce((a, b) => a + b, 0)
            : counts[genre.id] || 0;
        const active = selected === genre.id;

        return (
          <button
            key={genre.id}
            onClick={() => onSelect(genre.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-150 ${
              active
                ? 'bg-indigo-600 text-white shadow-md scale-[1.04]'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600 hover:scale-[1.02]'
            }`}
          >
            <span>{genre.emoji}</span>
            {genre.label}
            {/* 노트 개수 뱃지: 0보다 클 때만 표시 */}
            {count > 0 && (
              <span
                className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                  active ? 'bg-white/25 text-white' : 'bg-indigo-50 text-indigo-500'
                }`}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
