'use client';
// ──────────────────────────────────────────────────────────────────────────────
// components/Recommendations.jsx
// 스마트 추천 패널 — useRecommendations 훅의 결과를 시각화
// ──────────────────────────────────────────────────────────────────────────────
import { Sparkles, TrendingUp, Compass, Tag, Star } from 'lucide-react';
import { useRecommendations } from '@/hooks/useRecommendations';
import { useGenres } from '@/hooks/useGenres';
import { StarRating } from './StarRating';

// 선호 특성 프로파일 바
function ProfileBar({ item, avg }) {
  const pct = (avg / 10) * 100;
  const color =
    avg >= 9 ? '#22c55e' : avg >= 7 ? '#6366f1' : avg >= 5 ? '#f59e0b' : '#94a3b8';
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-slate-600 w-16 shrink-0 text-right truncate">{item}</span>
      <div className="flex-1 bg-slate-100 rounded-full overflow-hidden h-2">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-xs font-bold w-8 text-right" style={{ color }}>
        {avg}
      </span>
    </div>
  );
}

// 노트 미니 카드 (추천용)
function MiniNoteCard({ note, badge, reason }) {
  const { getGenreById } = useGenres();
  const genre = getGenreById(note.genre || note.category);

  return (
    <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
      {note.posterUrl ? (
        <img
          src={note.posterUrl}
          alt={note.title}
          className="w-10 h-14 object-cover rounded-lg shrink-0"
        />
      ) : (
        <div
          className="w-10 h-14 rounded-lg flex items-center justify-center text-lg shrink-0"
          style={{ backgroundColor: genre.chartColor + '22' }}
        >
          {genre.emoji}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${genre.bg} ${genre.text}`}>
            {genre.label}
          </span>
          {badge && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600 font-medium">
              {badge}
            </span>
          )}
        </div>
        <p className="text-sm font-semibold text-slate-800 truncate">{note.title}</p>
        {note.rating > 0 && <StarRating value={note.rating} readonly size="sm" />}
        {reason && <p className="text-[10px] text-slate-400 mt-0.5">{reason}</p>}
      </div>
    </div>
  );
}

export function Recommendations({ notes }) {
  const { profile, similar, unexplored, tagBased } = useRecommendations(notes);
  const { getGenreById } = useGenres();

  const isEmpty = !profile.length && !similar.length && !tagBased.length;

  if (notes.length < 3) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 flex flex-col items-center gap-3 text-slate-400">
        <Sparkles className="w-10 h-10 opacity-40" />
        <p className="text-sm font-medium text-slate-500">데이터가 부족해요</p>
        <p className="text-xs text-center max-w-xs">
          노트를 3개 이상 추가하면 취향 분석과 추천이 시작됩니다.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-6">

      {/* ── ① 선호 특성 프로파일 ─────────────────────────────── */}
      {profile.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-indigo-500" />
            <h3 className="text-sm font-bold text-slate-700">나의 선호 특성</h3>
            <span className="text-xs text-slate-400">평균 7점 이상인 평가 항목</span>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col gap-2.5">
            {profile.map(({ item, avg }) => (
              <ProfileBar key={item} item={item} avg={avg} />
            ))}
          </div>
        </section>
      )}

      {/* ── ② 취향 패턴 유사 노트 ───────────────────────────── */}
      {similar.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-purple-500" />
            <h3 className="text-sm font-bold text-slate-700">비슷한 취향 노트</h3>
          </div>
          <div className="flex flex-col gap-2">
            {similar.map(({ note, similarity, reason }) => (
              <MiniNoteCard
                key={note.id}
                note={note}
                badge={`${similarity}% 일치`}
                reason={reason}
              />
            ))}
          </div>
        </section>
      )}

      {/* ── ③ 태그 기반 추천 ─────────────────────────────────── */}
      {tagBased.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Tag className="w-4 h-4 text-teal-500" />
            <h3 className="text-sm font-bold text-slate-700">태그 기반 추천</h3>
          </div>
          <div className="flex flex-col gap-2">
            {tagBased.map(({ note, matchedTags }) => (
              <MiniNoteCard
                key={note.id}
                note={note}
                badge={`#${matchedTags[0]}`}
                reason="공통 태그 일치"
              />
            ))}
          </div>
        </section>
      )}

      {/* ── ④ 미탐색 장르 ────────────────────────────────────── */}
      {unexplored.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Compass className="w-4 h-4 text-orange-500" />
            <h3 className="text-sm font-bold text-slate-700">재탐색 추천 장르</h3>
            <span className="text-xs text-slate-400">아직 충분히 즐기지 않은 장르</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {unexplored.map(({ genre: genreId, avgRating, count }) => {
              const genre = getGenreById(genreId);
              return (
                <div
                  key={genreId}
                  className="flex flex-col items-center gap-1.5 p-3 bg-white rounded-2xl border border-slate-100 shadow-sm"
                >
                  <span className="text-2xl">{genre.emoji}</span>
                  <span className="text-xs font-medium text-slate-700">{genre.label}</span>
                  <span className="text-[10px] text-slate-400">{count}개 · 평균 {avgRating}점</span>
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3 h-3 ${i < Math.round(avgRating) ? 'fill-amber-400 text-amber-400' : 'fill-slate-200 text-slate-200'}`}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {isEmpty && (
        <div className="text-center py-10 text-slate-400">
          <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">분석할 데이터가 부족합니다.</p>
          <p className="text-xs mt-1">더 많은 세부 점수를 입력해보세요.</p>
        </div>
      )}
    </div>
  );
}
