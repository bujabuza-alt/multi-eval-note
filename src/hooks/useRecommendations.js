'use client';
// ──────────────────────────────────────────────────────────────────────────────
// hooks/useRecommendations.js
// 스마트 추천 시스템 — 사용자의 내부 데이터를 분석해 선호 패턴을 파악하고
// 비슷한 성향의 노트 중 아직 감상하지 않은 콘텐츠를 추천합니다.
//
// 추천 로직:
// 1. 각 평가 항목(evalItem)별 평균 점수를 계산 → 선호 특성 프로파일 추출
// 2. 높은 점수(≥7)를 가진 항목을 "선호 특성"으로 분류
// 3. 유사한 선호 특성을 가진 노트 중 평점이 높은 것을 "비슷한 취향" 추천
// 4. 아직 시도하지 않은 장르의 인기 노트를 "새로운 발견" 추천
// 5. 같은 태그를 가진 비슷한 노트를 "태그 기반" 추천
// ──────────────────────────────────────────────────────────────────────────────
import { useMemo } from 'react';

// 항목별 평균 점수 계산
function computeItemAverages(notes) {
  const totals = {};
  const counts = {};
  for (const note of notes) {
    if (!note.scores) continue;
    const items = note.evalItems || [];
    for (const item of items) {
      const score = note.scores[item] ?? 0;
      if (score > 0) {
        totals[item] = (totals[item] || 0) + score;
        counts[item] = (counts[item] || 0) + 1;
      }
    }
  }
  return Object.fromEntries(
    Object.keys(totals).map((item) => [item, totals[item] / counts[item]])
  );
}

// 두 노트의 점수 벡터 간 코사인 유사도 (0~1)
function cosineSimilarity(scoresA, scoresB, items) {
  let dot = 0, magA = 0, magB = 0;
  for (const item of items) {
    const a = scoresA[item] ?? 0;
    const b = scoresB[item] ?? 0;
    dot += a * b;
    magA += a * a;
    magB += b * b;
  }
  if (!magA || !magB) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

export function useRecommendations(notes) {
  return useMemo(() => {
    if (notes.length < 3) return { profile: [], similar: [], unexplored: [], tagBased: [] };

    // ① 선호 특성 프로파일 — 평균 ≥ 7 인 항목들
    const itemAvgs = computeItemAverages(notes);
    const profile = Object.entries(itemAvgs)
      .filter(([, avg]) => avg >= 7)
      .sort(([, a], [, b]) => b - a)
      .map(([item, avg]) => ({ item, avg: Number(avg.toFixed(1)) }));

    // ② 비슷한 취향 추천 — 별점 ≥ 4 인 노트 중 점수 패턴이 유사한 항목 찾기
    const topRated = notes.filter((n) => (n.rating || 0) >= 4);
    const allItems = [...new Set(notes.flatMap((n) => n.evalItems || []))];

    // 각 노트쌍의 유사도 계산 → 자기 자신 제외 상위 추천
    const similarMap = new Map();
    for (const base of topRated) {
      for (const candidate of notes) {
        if (base.id === candidate.id) continue;
        if (!base.scores || !candidate.scores) continue;
        const sim = cosineSimilarity(base.scores, candidate.scores, allItems);
        const prev = similarMap.get(candidate.id) || 0;
        if (sim > prev) similarMap.set(candidate.id, sim);
      }
    }
    const similar = [...similarMap.entries()]
      .filter(([, sim]) => sim > 0.6)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([id, sim]) => ({
        note: notes.find((n) => n.id === id),
        similarity: Math.round(sim * 100),
        reason: '취향 패턴 일치',
      }))
      .filter((r) => r.note);

    // ③ 미탐색 장르 추천 — 아직 별점이 낮거나 없는 장르에서 태그/메모 기반 추천
    const genreRatings = {};
    for (const n of notes) {
      const g = n.genre || n.category;
      if (!genreRatings[g]) genreRatings[g] = [];
      if (n.rating) genreRatings[g].push(n.rating);
    }
    // 평균 별점이 낮은 장르의 노트 → 재발견 가능 후보
    const unexplored = Object.entries(genreRatings)
      .map(([genre, ratings]) => ({
        genre,
        avg: ratings.length ? ratings.reduce((s, r) => s + r, 0) / ratings.length : 0,
        count: ratings.length,
      }))
      .filter((g) => g.avg < 3 && g.count >= 1)
      .sort((a, b) => a.avg - b.avg)
      .slice(0, 3)
      .map((g) => ({
        genre: g.genre,
        avgRating: Number(g.avg.toFixed(1)),
        count: g.count,
        reason: '재탐색 추천',
      }));

    // ④ 태그 기반 추천 — 가장 많이 사용된 태그와 같은 태그를 가진 고평점 노트
    const tagCounts = {};
    for (const n of notes) {
      for (const tag of (n.tags || [])) {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      }
    }
    const topTags = Object.entries(tagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([tag]) => tag);

    const tagBased = notes
      .filter((n) => (n.rating || 0) >= 4 && n.tags?.some((t) => topTags.includes(t)))
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 4)
      .map((note) => ({
        note,
        matchedTags: (note.tags || []).filter((t) => topTags.includes(t)),
        reason: '태그 일치',
      }));

    return { profile, similar, unexplored, tagBased };
  }, [notes]);
}
