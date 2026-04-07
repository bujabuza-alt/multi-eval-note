'use client';

export function CategoryFilter({ selected, onSelect, counts, categories = [] }) {
  const all = [{ id: 'all', label: '전체', emoji: '📋' }, ...categories];

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      {all.map((cat) => {
        const count =
          cat.id === 'all'
            ? Object.values(counts).reduce((a, b) => a + b, 0)
            : counts[cat.id] || 0;
        const active = selected === cat.id;
        return (
          <button
            key={cat.id}
            onClick={() => onSelect(cat.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-150 ${
              active
                ? 'bg-indigo-600 text-white shadow-md scale-[1.04]'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600 hover:scale-[1.02]'
            }`}
          >
            <span>{cat.emoji}</span>
            {cat.label}
            {count > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                active ? 'bg-white/25 text-white' : 'bg-indigo-50 text-indigo-500'
              }`}>
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
