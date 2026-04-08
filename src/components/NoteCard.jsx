'use client';
// ──────────────────────────────────────────────────────────────────────────────
// components/NoteCard.jsx
// 노트 카드 컴포넌트.
//
// 변경 사항:
// ① 접기/펼치기(Collapse/Expand) 토글 추가 — 기본값: 접힌 상태
// ② 포스터 이미지 지원 (note.posterUrl 필드)
// ③ 접힌 상태: 장르 뱃지 + 제목 + 별점 + 액션 버튼만 표시 (1줄 compact)
// ④ 펼친 상태: 포스터 + 차트 + 메모 + 태그 + 날짜 (부드러운 전환 애니메이션)
// ──────────────────────────────────────────────────────────────────────────────
import { useState } from 'react';
import { Pencil, Trash2, ChevronDown } from 'lucide-react';
import { StarRating } from './StarRating';
import { ScoreVisualization } from './ScoreVisualization';
import { useGenres } from '@/hooks/useGenres';

function formatDate(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${y}년 ${Number(m)}월 ${Number(d)}일`;
}

export function NoteCard({ note, onEdit, onDelete }) {
  const { getGenreById } = useGenres();
  const [collapsed, setCollapsed] = useState(true);

  const genreId = note.genre || note.category;
  const genre = getGenreById(genreId);
  const evalItems = note.evalItems || genre.defaultItems || [];
  const hasScores =
    note.scores && evalItems.some((item) => (note.scores[item] ?? 0) > 0);

  return (
    <div
      className={`group bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200 border border-slate-100 overflow-hidden`}
    >
      {/* ── 항상 표시: 컴팩트 헤더 ─────────────────────────────────────── */}
      <div className="flex items-center gap-2 px-4 py-3">
        {/* 장르 뱃지 */}
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${genre.bg} ${genre.text}`}
        >
          <span>{genre.emoji}</span>
          <span className="hidden sm:inline">{genre.label}</span>
        </span>

        {/* 포스터 썸네일 (접힌 상태에서 작게 표시) */}
        {note.posterUrl && collapsed && (
          <img
            src={note.posterUrl}
            alt={note.title}
            className="w-7 h-10 object-cover rounded shrink-0"
          />
        )}

        {/* 제목 */}
        <h3
          className="flex-1 text-sm font-semibold text-slate-800 truncate leading-snug cursor-pointer select-none"
          onClick={() => setCollapsed((v) => !v)}
          title={note.title}
        >
          {note.title}
        </h3>

        {/* 종합 별점 (접힌 상태에서도 표시) */}
        {note.rating > 0 && (
          <div className="shrink-0">
            <StarRating value={note.rating} readonly size="sm" />
          </div>
        )}

        {/* 수정·삭제·접기 버튼 */}
        <div className="flex items-center gap-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0">
          <button
            onClick={() => onEdit(note)}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
            aria-label="수정"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(note.id)}
            className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition-colors"
            aria-label="삭제"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setCollapsed((v) => !v)}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
            aria-label={collapsed ? '펼치기' : '접기'}
          >
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform duration-300 ${
                collapsed ? '' : 'rotate-180'
              }`}
            />
          </button>
        </div>
      </div>

      {/* ── 펼쳐지는 상세 영역 ───────────────────────────────────────────── */}
      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          collapsed ? 'max-h-0' : 'max-h-[800px]'
        }`}
      >
        <div className="px-4 pb-4 flex flex-col gap-3 border-t border-slate-50 pt-3">

          {/* 포스터 이미지 (펼쳤을 때 전체 크기) */}
          {note.posterUrl && (
            <div className="flex justify-center">
              <img
                src={note.posterUrl}
                alt={note.title}
                className="max-h-52 rounded-xl object-cover shadow-sm"
              />
            </div>
          )}

          {/* 세부 점수 시각화 */}
          {hasScores && (
            <ScoreVisualization
              items={evalItems}
              scores={note.scores}
              vizType={note.vizType || 'radar'}
              color={genre.chartColor}
              size={140}
              compact={true}
              showAvg={true}
            />
          )}

          {/* 메모 */}
          {note.memo && (
            <p className="text-sm text-slate-500 line-clamp-4 leading-relaxed">
              {note.memo}
            </p>
          )}

          {/* 태그 */}
          {note.tags && note.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {note.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-full"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* 날짜 */}
          {note.date && (
            <p className="text-xs text-slate-400 border-t border-slate-50 pt-2">
              {formatDate(note.date)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
