// ──────────────────────────────────────────────────────────────────────────────
// components/EmptyState.jsx
// 노트가 없을 때 또는 검색/필터 결과가 없을 때 표시되는 빈 상태 화면.
// '카테고리' → '장르'로 텍스트 변경.
// ──────────────────────────────────────────────────────────────────────────────
export function EmptyState({ filtered }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="text-6xl mb-4">{filtered ? '🔍' : '📝'}</div>
      <h3 className="text-lg font-semibold text-slate-700 mb-1">
        {filtered ? '결과가 없어요' : '아직 기록이 없어요'}
      </h3>
      <p className="text-sm text-slate-400">
        {filtered
          ? '다른 장르나 검색어를 시도해보세요.'  // '카테고리' → '장르'
          : '좋아하는 것들을 기록해보세요!'}
      </p>
    </div>
  );
}
