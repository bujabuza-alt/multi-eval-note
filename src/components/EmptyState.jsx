export function EmptyState({ filtered }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="text-6xl mb-4">{filtered ? '🔍' : '📝'}</div>
      <h3 className="text-lg font-semibold text-slate-700 mb-1">
        {filtered ? '결과가 없어요' : '아직 기록이 없어요'}
      </h3>
      <p className="text-sm text-slate-400">
        {filtered
          ? '다른 카테고리나 검색어를 시도해보세요.'
          : '좋아하는 것들을 기록해보세요!'}
      </p>
    </div>
  );
}
