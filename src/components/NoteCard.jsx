'use client';
// ──────────────────────────────────────────────────────────────────────────────
// components/NoteCard.jsx
// 노트 카드 컴포넌트.
//
// 주요 변경 사항:
// ① 정적 getCategoryById 대신 useGenres().getGenreById() 사용 (동적 장르 지원)
// ② note.evalItems가 있으면 해당 항목을 사용, 없으면 장르의 defaultItems 사용
//    → 노트별 커스텀 평가 항목이 카드에도 정확히 반영됩니다.
// ③ note.genre 또는 구버전 note.category 필드 모두 지원
// ④ 모바일에서 수정·삭제 버튼이 항상 보이도록 개선 (터치 친화적)
// ──────────────────────────────────────────────────────────────────────────────
import { Pencil, Trash2 } from 'lucide-react';
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

  // genre 필드 (신버전) 또는 category 필드 (구버전) 모두 지원
  const genreId = note.genre || note.category;
  const genre = getGenreById(genreId);

  // 세부 평가 항목: 노트에 저장된 커스텀 항목 우선, 없으면 장르 기본값
  const evalItems = note.evalItems || genre.defaultItems || [];

  // 해당 항목들 중 0보다 큰 점수가 있는지 확인
  const hasScores =
    note.scores && evalItems.some((item) => (note.scores[item] ?? 0) > 0);

  return (
    <div className="group bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200 p-5 flex flex-col gap-3 border border-slate-100">
      {/* ── 카드 헤더: 장르 뱃지 + 액션 버튼 ──────────────────────────── */}
      <div className="flex items-start justify-between gap-2">
        {/* 장르 뱃지 */}
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium shrink-0 ${genre.bg} ${genre.text}`}
        >
          <span>{genre.emoji}</span>
          {genre.label}
        </span>

        {/* 수정·삭제 버튼
            - 데스크톱: hover 시 표시 (group-hover:opacity-100)
            - 모바일: 항상 표시 (sm:opacity-0으로 데스크톱은 숨김 → hover 시 복원) */}
        <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0">
          <button
            onClick={() => onEdit(note)}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
            aria-label="수정"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(note.id)}
            className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition-colors"
            aria-label="삭제"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── 제목 ──────────────────────────────────────────────────────── */}
      <h3 className="text-lg font-semibold text-slate-800 leading-snug line-clamp-2">
        {note.title}
      </h3>

      {/* ── 종합 별점 ─────────────────────────────────────────────────── */}
      {note.rating > 0 && <StarRating value={note.rating} readonly size="sm" />}

      {/* ── 세부 점수 시각화 ───────────────────────────────────────────── */}
      {hasScores && (
        <div className="pt-1">
          <ScoreVisualization
            items={evalItems}
            scores={note.scores}
            vizType={note.vizType || 'radar'}
            color={genre.chartColor}
            size={140}
            compact={true}
            showAvg={true}
          />
        </div>
      )}

      {/* ── 메모 ──────────────────────────────────────────────────────── */}
      {note.memo && (
        <p className="text-sm text-slate-500 line-clamp-3 leading-relaxed">{note.memo}</p>
      )}

      {/* ── 태그 ──────────────────────────────────────────────────────── */}
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

      {/* ── 날짜 ──────────────────────────────────────────────────────── */}
      {note.date && (
        <p className="text-xs text-slate-400 mt-auto pt-1 border-t border-slate-50">
          {formatDate(note.date)}
        </p>
      )}
    </div>
  );
}
