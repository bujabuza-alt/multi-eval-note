'use client';
// ──────────────────────────────────────────────────────────────────────────────
// components/HallOfFame.jsx
// 명예의 전당 — 5점 만점 또는 masterpiece 플래그가 있는 노트를 프리미엄 UI로 표시
// ──────────────────────────────────────────────────────────────────────────────
import { Crown, Star } from 'lucide-react';
import { useGenres } from '@/hooks/useGenres';
import { StarRating } from './StarRating';
import { ScoreVisualization } from './ScoreVisualization';

function formatDate(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${y}년 ${Number(m)}월 ${Number(d)}일`;
}

function HallCard({ note, rank }) {
  const { getGenreById } = useGenres();
  const genre = getGenreById(note.genre || note.category);
  const evalItems = note.evalItems || genre.defaultItems || [];
  const hasScores = note.scores && evalItems.some((item) => (note.scores[item] ?? 0) > 0);

  // 순위별 골드/실버/브론즈 색상
  const rankColors = [
    { ring: 'ring-yellow-400', glow: 'shadow-yellow-200', badge: 'bg-yellow-400', text: 'text-yellow-700', icon: '🥇' },
    { ring: 'ring-slate-400', glow: 'shadow-slate-200', badge: 'bg-slate-400', text: 'text-slate-600', icon: '🥈' },
    { ring: 'ring-orange-400', glow: 'shadow-orange-200', badge: 'bg-orange-400', text: 'text-orange-700', icon: '🥉' },
  ];
  const rc = rank < 3 ? rankColors[rank] : { ring: 'ring-indigo-200', glow: 'shadow-indigo-100', badge: 'bg-indigo-400', text: 'text-indigo-600', icon: '🏅' };

  return (
    <div
      className={`relative bg-white rounded-2xl border-2 ${rc.ring} shadow-lg ${rc.glow} overflow-hidden flex flex-col`}
    >
      {/* 상단 글로우 라인 */}
      <div
        className="absolute top-0 left-0 right-0 h-1 opacity-70"
        style={{ background: `linear-gradient(90deg, transparent, ${genre.chartColor}, transparent)` }}
      />

      {/* 순위 배지 */}
      <div className={`absolute top-3 right-3 w-7 h-7 rounded-full ${rc.badge} flex items-center justify-center text-white text-xs font-bold shadow z-10`}>
        {rank + 1}
      </div>

      {/* 포스터 + 마스터피스 왕관 */}
      {note.posterUrl ? (
        <div className="relative">
          <img
            src={note.posterUrl}
            alt={note.title}
            className="w-full h-44 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          {note.masterpiece && (
            <div className="absolute top-3 left-3">
              <Crown className="w-5 h-5 text-yellow-400 drop-shadow" />
            </div>
          )}
        </div>
      ) : (
        <div
          className="w-full h-20 flex items-center justify-center text-4xl"
          style={{ background: `linear-gradient(135deg, ${genre.chartColor}22, ${genre.chartColor}44)` }}
        >
          {note.masterpiece ? '👑' : genre.emoji}
        </div>
      )}

      <div className="p-4 flex flex-col gap-2 flex-1">
        {/* 장르 + 마스터피스 */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${genre.bg} ${genre.text}`}>
            {genre.emoji} {genre.label}
          </span>
          {note.masterpiece && (
            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-bold bg-yellow-50 text-yellow-600 border border-yellow-200">
              <Crown className="w-3 h-3" /> 명작
            </span>
          )}
        </div>

        {/* 제목 */}
        <h3 className="text-base font-bold text-slate-800 leading-snug line-clamp-2">
          {note.title}
        </h3>

        {/* 별점 */}
        <StarRating value={note.rating} readonly size="sm" />

        {/* 세부 점수 */}
        {hasScores && (
          <ScoreVisualization
            items={evalItems}
            scores={note.scores}
            vizType={note.vizType || 'radar'}
            color={genre.chartColor}
            size={120}
            compact={true}
            showAvg={true}
          />
        )}

        {/* 메모 */}
        {note.memo && (
          <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed flex-1">
            {note.memo}
          </p>
        )}

        {/* 날짜 */}
        {note.date && (
          <p className={`text-xs font-medium ${rc.text} mt-auto`}>{formatDate(note.date)}</p>
        )}
      </div>
    </div>
  );
}

export function HallOfFame({ notes, onToggleMasterpiece }) {
  // 5점 만점 또는 masterpiece 플래그가 있는 노트 필터링, 평점+날짜 내림차순 정렬
  const hallNotes = notes
    .filter((n) => n.rating === 5 || n.masterpiece)
    .sort((a, b) => {
      if (b.rating !== a.rating) return (b.rating || 0) - (a.rating || 0);
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });

  if (!hallNotes.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
        <span className="text-5xl">🏆</span>
        <p className="text-sm font-medium text-slate-500">아직 명예의 전당이 비어있어요</p>
        <p className="text-xs text-center max-w-xs">
          별점 5점을 주거나 카드에서 "명작" 버튼을 눌러 등록해보세요.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* 헤더 */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-md">
            <Crown className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">명예의 전당</h2>
            <p className="text-xs text-slate-400">총 {hallNotes.length}개의 명작</p>
          </div>
        </div>
        <div className="flex-1 h-px bg-gradient-to-r from-yellow-200 to-transparent" />
      </div>

      {/* 카드 그리드 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {hallNotes.map((note, i) => (
          <HallCard key={note.id} note={note} rank={i} />
        ))}
      </div>

      {/* 안내 */}
      <div className="mt-6 p-3 bg-amber-50 rounded-xl border border-amber-100 flex items-start gap-2">
        <Star className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-700">
          별점 5점을 주면 자동으로 명예의 전당에 등록됩니다.
          노트 편집 화면에서 "명작" 표시를 직접 설정할 수도 있습니다.
        </p>
      </div>
    </div>
  );
}
