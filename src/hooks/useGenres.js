'use client';
// ──────────────────────────────────────────────────────────────────────────────
// hooks/useGenres.js
// 장르(Genre) 목록을 localStorage에 저장하고 React Context로 전체 앱에 제공합니다.
// 기존 정적 CATEGORIES 대신 이 훅에서 반환하는 genres를 사용합니다.
// ──────────────────────────────────────────────────────────────────────────────
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { DEFAULT_GENRES, COLOR_PRESETS } from '@/lib/categories';

// localStorage 키
const GENRES_STORAGE_KEY = 'multi-eval-genres';

// Context 생성 (초기값 null → 프로바이더 밖에서 사용 시 오류 감지)
const GenresContext = createContext(null);

/**
 * GenresProvider
 * 앱 최상단에 배치하여 모든 하위 컴포넌트가 useGenres()로 장르 데이터에 접근할 수 있게 합니다.
 */
export function GenresProvider({ children }) {
  const [genres, setGenres] = useState(DEFAULT_GENRES);
  const [loaded, setLoaded] = useState(false);

  // 마운트 시 localStorage에서 장르 목록을 불러옵니다
  useEffect(() => {
    try {
      const stored = localStorage.getItem(GENRES_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // 유효한 배열이면 적용, 아니면 기본값 유지
        if (Array.isArray(parsed) && parsed.length > 0) {
          setGenres(parsed);
        }
      }
    } catch (e) {
      console.error('장르 목록 불러오기 실패:', e);
    }
    setLoaded(true);
  }, []);

  // 상태 변경 + localStorage 동기 저장
  const persist = useCallback((nextGenres) => {
    setGenres(nextGenres);
    try {
      localStorage.setItem(GENRES_STORAGE_KEY, JSON.stringify(nextGenres));
    } catch (e) {
      console.error('장르 목록 저장 실패:', e);
    }
  }, []);

  /** 새 장르 추가 */
  const addGenre = useCallback(
    (genre) => {
      const newGenre = {
        ...genre,
        id: `genre-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      };
      persist([...genres, newGenre]);
      return newGenre;
    },
    [genres, persist]
  );

  /** 기존 장르 수정 (id로 찾아서 data를 병합) */
  const updateGenre = useCallback(
    (id, data) => {
      persist(genres.map((g) => (g.id === id ? { ...g, ...data } : g)));
    },
    [genres, persist]
  );

  /** 장르 삭제 */
  const deleteGenre = useCallback(
    (id) => {
      persist(genres.filter((g) => g.id !== id));
    },
    [genres, persist]
  );

  /**
   * id로 장르 객체 반환.
   * 찾지 못하면 마지막 장르(기타)를 반환합니다.
   * 삭제된 장르를 참조하는 노트 카드에서 안전하게 사용할 수 있습니다.
   */
  const getGenreById = useCallback(
    (id) => {
      return (
        genres.find((g) => g.id === id) ||
        genres[genres.length - 1] ||
        DEFAULT_GENRES[DEFAULT_GENRES.length - 1]
      );
    },
    [genres]
  );

  /** 기본 장르 목록으로 초기화 */
  const resetGenres = useCallback(() => {
    persist(DEFAULT_GENRES);
  }, [persist]);

  return (
    <GenresContext.Provider
      value={{ genres, loaded, addGenre, updateGenre, deleteGenre, getGenreById, resetGenres, COLOR_PRESETS }}
    >
      {children}
    </GenresContext.Provider>
  );
}

/**
 * useGenres 훅
 * GenresProvider 내부에서만 사용 가능합니다.
 * genres, addGenre, updateGenre, deleteGenre, getGenreById, resetGenres, COLOR_PRESETS 반환.
 */
export function useGenres() {
  const ctx = useContext(GenresContext);
  if (!ctx) {
    throw new Error('useGenres()는 <GenresProvider> 안에서만 사용할 수 있습니다.');
  }
  return ctx;
}
