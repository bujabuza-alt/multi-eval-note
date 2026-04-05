'use client';
import { CATEGORIES } from '@/lib/categories';

export function CategoryFilter({ selected, onSelect, counts }) {
  const all = [{ id: 'all', label: '전체', emoji: '📋' }, ...CATEGORIES];

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      {all.map((cat) => {
        const count = cat.id === 'all'
          ? Object.values(counts).reduce((a, b) => a + b, 0)
          : (counts[cat.id] || 0);
        const active = selected === cat.id;
        return (
          <button
            key={cat.id}
            onClick={() => onSelect(cat.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-150 ${
              active
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <span>{cat.emoji}</span>
            {cat.label}
            {count > 0 && (
              <span
                className={`text-xs px-1.5 py-0.5 rounded-full ${
                  active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
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
