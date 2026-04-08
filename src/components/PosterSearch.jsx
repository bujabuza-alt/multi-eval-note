'use client';
// ──────────────────────────────────────────────────────────────────────────────
// components/PosterSearch.jsx
// 포스터/아트워크 자동 검색 컴포넌트.
//
// 지원 API (무료 / 키 불필요):
//  - Jikan (MyAnimeList): anime 장르
//  - Open Library: book 장르
//  - OMDB (선택적 API 키): movie, game 등
//  - 직접 URL 입력: 모든 장르 공통 fallback
//
// Props:
//  - genreId       string   현재 노트의 장르 ID
//  - title         string   검색어 초기값 (노트 제목)
//  - currentUrl    string   현재 설정된 posterUrl
//  - onSelect      (url) => void   이미지 선택 콜백
//  - onClose       () => void      패널 닫기 콜백
// ──────────────────────────────────────────────────────────────────────────────
import { useState, useEffect } from 'react';
import { Search, X, ExternalLink, ImageOff, Link } from 'lucide-react';

// 장르별 검색 API 라우터
async function searchPosters(genreId, query) {
  const q = encodeURIComponent(query.trim());
  if (!q) return [];

  // 애니메이션 → Jikan API (MyAnimeList)
  if (genreId === 'anime') {
    try {
      const res = await fetch(
        `https://api.jikan.moe/v4/anime?q=${q}&limit=8&sfw=true`
      );
      const json = await res.json();
      return (json.data || []).map((item) => ({
        id: item.mal_id,
        title: item.title,
        imageUrl: item.images?.jpg?.large_image_url || item.images?.jpg?.image_url,
        subtitle: item.year ? `${item.year}년` : item.type || '',
      }));
    } catch {
      return [];
    }
  }

  // 책 → Open Library
  if (genreId === 'book') {
    try {
      const res = await fetch(
        `https://openlibrary.org/search.json?title=${q}&limit=8&fields=key,title,author_name,cover_i,first_publish_year`
      );
      const json = await res.json();
      return (json.docs || [])
        .filter((d) => d.cover_i)
        .slice(0, 8)
        .map((d) => ({
          id: d.key,
          title: d.title,
          imageUrl: `https://covers.openlibrary.org/b/id/${d.cover_i}-M.jpg`,
          subtitle: d.author_name?.[0] || '',
        }));
    } catch {
      return [];
    }
  }

  // 영화/게임 → OMDB (API 키 없으면 URL 입력 안내)
  if (genreId === 'movie' || genreId === 'game') {
    const apiKey = typeof window !== 'undefined'
      ? localStorage.getItem('omdb_api_key')
      : null;
    if (!apiKey) return null; // null = 키 없음 신호
    try {
      const type = genreId === 'movie' ? '&type=movie' : '';
      const res = await fetch(
        `https://www.omdbapi.com/?s=${q}&apikey=${apiKey}${type}`
      );
      const json = await res.json();
      if (json.Response === 'False') return [];
      return (json.Search || []).map((item) => ({
        id: item.imdbID,
        title: item.Title,
        imageUrl: item.Poster !== 'N/A' ? item.Poster : null,
        subtitle: item.Year || '',
      }));
    } catch {
      return [];
    }
  }

  return [];
}

export function PosterSearch({ genreId, title, currentUrl, onSelect, onClose }) {
  const [query, setQuery] = useState(title || '');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [noKeyWarning, setNoKeyWarning] = useState(false);
  const [tab, setTab] = useState('search'); // 'search' | 'url'
  const [urlInput, setUrlInput] = useState(currentUrl || '');
  const [omdbKey, setOmdbKey] = useState(
    typeof window !== 'undefined' ? localStorage.getItem('omdb_api_key') || '' : ''
  );
  const [showKeyInput, setShowKeyInput] = useState(false);

  // 검색 실행
  const doSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setNoKeyWarning(false);
    const data = await searchPosters(genreId, query);
    setLoading(false);
    if (data === null) {
      setNoKeyWarning(true);
      setResults([]);
    } else {
      setResults(data);
    }
  };

  // 마운트 시 자동 검색 (title이 있을 때)
  useEffect(() => {
    if (title) doSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveOmdbKey = () => {
    localStorage.setItem('omdb_api_key', omdbKey);
    setShowKeyInput(false);
    doSearch();
  };

  const unsupportedGenre =
    !['anime', 'book', 'movie', 'game'].includes(genreId);

  return (
    <div className="flex flex-col gap-3">
      {/* 탭 */}
      <div className="flex gap-1 p-0.5 bg-slate-100 rounded-lg">
        <button
          type="button"
          onClick={() => setTab('search')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs rounded-md font-medium transition-all ${
            tab === 'search'
              ? 'bg-white text-indigo-600 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Search className="w-3.5 h-3.5" />
          자동 검색
        </button>
        <button
          type="button"
          onClick={() => setTab('url')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs rounded-md font-medium transition-all ${
            tab === 'url'
              ? 'bg-white text-indigo-600 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Link className="w-3.5 h-3.5" />
          URL 직접 입력
        </button>
      </div>

      {/* ── 자동 검색 탭 ──────────────────────────────────────────── */}
      {tab === 'search' && (
        <>
          {unsupportedGenre ? (
            <div className="text-center py-4 text-sm text-slate-400">
              <ImageOff className="w-8 h-8 mx-auto mb-2 opacity-40" />
              이 장르는 자동 검색을 지원하지 않습니다.
              <br />
              URL 직접 입력 탭을 이용해주세요.
            </div>
          ) : (
            <>
              {/* 검색 입력 */}
              <div className="flex gap-2">
                <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl">
                  <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), doSearch())}
                    placeholder="제목으로 검색..."
                    className="flex-1 bg-transparent focus:outline-none text-sm text-slate-700 placeholder:text-slate-400 min-w-0"
                  />
                </div>
                <button
                  type="button"
                  onClick={doSearch}
                  disabled={loading}
                  className="px-3 py-2 bg-indigo-600 text-white text-sm rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors shrink-0"
                >
                  {loading ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
                  ) : (
                    '검색'
                  )}
                </button>
              </div>

              {/* OMDB 키 안내 */}
              {noKeyWarning && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
                  <p className="font-medium mb-1">OMDB API 키가 필요합니다</p>
                  <p className="mb-2 text-amber-600">
                    영화/게임 검색은{' '}
                    <a
                      href="https://www.omdbapi.com/apikey.aspx"
                      target="_blank"
                      rel="noreferrer"
                      className="underline inline-flex items-center gap-0.5"
                    >
                      omdbapi.com <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                    에서 무료 키를 발급받아 입력해주세요.
                  </p>
                  {showKeyInput ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={omdbKey}
                        onChange={(e) => setOmdbKey(e.target.value)}
                        placeholder="API 키 입력..."
                        className="flex-1 px-2 py-1 border border-amber-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-400 bg-white"
                      />
                      <button
                        type="button"
                        onClick={saveOmdbKey}
                        className="px-2 py-1 bg-amber-500 text-white rounded-lg text-xs hover:bg-amber-600 transition-colors"
                      >
                        저장
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowKeyInput(true)}
                      className="text-amber-700 underline font-medium"
                    >
                      키 입력하기
                    </button>
                  )}
                </div>
              )}

              {/* 검색 결과 그리드 */}
              {results.length > 0 && (
                <div className="grid grid-cols-4 gap-2 max-h-56 overflow-y-auto">
                  {results.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        if (item.imageUrl) {
                          onSelect(item.imageUrl);
                          onClose();
                        }
                      }}
                      disabled={!item.imageUrl}
                      className="flex flex-col items-center gap-1 group/item disabled:opacity-40"
                      title={item.title}
                    >
                      <div className="w-full aspect-[2/3] rounded-lg overflow-hidden bg-slate-100 border-2 border-transparent group-hover/item:border-indigo-400 transition-all">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.title}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageOff className="w-5 h-5 text-slate-300" />
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500 text-center line-clamp-2 leading-tight w-full">
                        {item.title}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {results.length === 0 && !loading && !noKeyWarning && query && (
                <p className="text-center text-xs text-slate-400 py-3">
                  검색 결과가 없습니다.
                </p>
              )}
            </>
          )}
        </>
      )}

      {/* ── URL 직접 입력 탭 ──────────────────────────────────────── */}
      {tab === 'url' && (
        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl">
              <Link className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="이미지 URL을 입력하세요..."
                className="flex-1 bg-transparent focus:outline-none text-sm text-slate-700 placeholder:text-slate-400 min-w-0"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                if (urlInput.trim()) {
                  onSelect(urlInput.trim());
                  onClose();
                }
              }}
              className="px-3 py-2 bg-indigo-600 text-white text-sm rounded-xl hover:bg-indigo-700 transition-colors shrink-0"
            >
              적용
            </button>
          </div>
          {urlInput && (
            <div className="flex justify-center">
              <img
                src={urlInput}
                alt="미리보기"
                className="max-h-40 rounded-xl object-cover shadow-sm border border-slate-200"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            </div>
          )}
        </div>
      )}

      {/* 현재 선택된 이미지 제거 */}
      {currentUrl && (
        <button
          type="button"
          onClick={() => { onSelect(null); onClose(); }}
          className="flex items-center justify-center gap-1 text-xs text-rose-500 hover:text-rose-700 transition-colors"
        >
          <X className="w-3 h-3" />
          포스터 제거
        </button>
      )}
    </div>
  );
}
