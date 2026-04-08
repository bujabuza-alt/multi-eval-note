'use client';
// ──────────────────────────────────────────────────────────────────────────────
// components/TimelineView.jsx
// 타임라인 뷰 — 노트를 연/월 기준으로 그룹화하여 세로 타임라인으로 표시
// ──────────────────────────────────────────────────────────────────────────────
import { useGenres } from '@/hooks/useGenres';
import { StarRating } from './StarRating';

function formatMonthLabel(year, month) {
  return `${year}년 ${month}월`;
}

function groupByYearMonth(notes) {
  const groups = {};
  for (const note of notes) {
    const dateStr = note.date || note.createdAt?.split('T')[0] || '';
    const [y, m] = dateStr.split('-');
    if (!y || !m) continue;
    const key = `${y}-${m.padStart(2, '0')}`;
    if (!groups[key]) groups[key] = { year: y, month: Number(m), notes: [] };
    groups[key].notes.push(note);
  }
  // 최신순 정렬
  return Object.entries(groups)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([, v]) => v);
}

function TimelineEntry({ note }) {
  const { getGenreById } = useGenres();
  const genre = getGenreById(note.genre || note.category);
  const day = note.date?.split('-')[2] ? Number(note.date.split('-')[2]) : null;

  return (
    <div className="flex gap-3 group">
      {/* 날짜 원 */}
      <div className="flex flex-col items-center shrink-0" style={{ width: 48 }}>
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-sm shrink-0`}
          style={{ backgroundColor: genre.chartColor }}
        >
          {day ?? '?'}
        </div>
        <div className="flex-1 w-0.5 bg-slate-200 mt-1" />
      </div>

      {/* 카드 */}
      <div className="flex-1 pb-6">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow p-3 flex gap-3">
          {/* 포스터 썸네일 */}
          {note.posterUrl ? (
            <img
              src={note.posterUrl}
              alt={note.title}
              className="w-12 h-16 object-cover rounded-lg shrink-0"
            />
          ) : (
            <div
              className="w-12 h-16 rounded-lg flex items-center justify-center text-xl shrink-0"
              style={{ backgroundColor: genre.chartColor + '22' }}
            >
              {genre.emoji}
            </div>
          )}

          <div className="flex-1 min-w-0">
            {/* 장르 뱃지 */}
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium mb-1 ${genre.bg} ${genre.text}`}
            >
              {genre.emoji} {genre.label}
            </span>

            {/* 제목 */}
            <h4 className="text-sm font-semibold text-slate-800 truncate leading-snug">
              {note.title}
            </h4>

            {/* 별점 */}
            {note.rating > 0 && (
              <div className="mt-1">
                <StarRating value={note.rating} readonly size="sm" />
              </div>
            )}

            {/* 메모 미리보기 */}
            {note.memo && (
              <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                {note.memo}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function TimelineView({ notes }) {
  if (!notes.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
        <span className="text-5xl">📅</span>
        <p className="text-sm">아직 기록이 없습니다</p>
      </div>
    );
  }

  const groups = groupByYearMonth(notes);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {groups.map((group) => (
        <div key={`${group.year}-${group.month}`} className="mb-2">
          {/* 연/월 헤더 */}
          <div className="flex items-center gap-3 mb-4">
            <div className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-sm font-bold shrink-0">
              {formatMonthLabel(group.year, group.month)}
            </div>
            <div className="flex-1 h-px bg-indigo-100" />
            <span className="text-xs text-slate-400 shrink-0">{group.notes.length}개</span>
          </div>

          {/* 노트 목록 */}
          <div className="pl-0">
            {group.notes.map((note) => (
              <TimelineEntry key={note.id} note={note} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
