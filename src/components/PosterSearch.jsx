'use client';
// ──────────────────────────────────────────────────────────────────────────────
// components/PosterSearch.jsx
// 포스터/아트워크 자동 검색 컴포넌트.
//
// 검색 우선순위:
//  1. Pinterest API (액세스 토큰 필요)
//  2. 장르별 전용 API (Jikan / Open Library / OMDB)
//  3. Google Custom Search API (키 + CX 필요, fallback)
//  4. URL 직접 입력 (공통 fallback)
//
// Props:
//  - genreId       string   현재 노트의 장르 ID
//  - genreLabel    string   현재 노트의 장르 레이블
//  - title         string   검색어 초기값 (노트 제목)
//  - currentUrl    string   현재 설정된 posterUrl
//  - onSelect      (url) => void
//  - onClose       () => void
// ──────────────────────────────────────────────────────────────────────────────
import { useState, useEffect } from 'react';
import { Search, X, ExternalLink, ImageOff, Link, Key } from 'lucide-react';

// ── 장르 판별 헬퍼 ────────────────────────────────────────────────────────────
function isAnimeGenre(genreId, genreLabel = '') {
  if (genreId === 'anime') return true;
  const label = genreLabel.toLowerCase();
  return label.includes('애니') || label.includes('anime') || label.includes('animation');
}

// ── API 1: Pinterest (Primary) ────────────────────────────────────────────────
// Pinterest v5 API — 액세스 토큰(Bearer)이 필요합니다.
// 브라우저 CORS 제한으로 실제 프로덕션에서는 서버 프록시가 필요할 수 있습니다.
async function searchPinterest(query, token) {
  const q = encodeURIComponent(query.trim());
  try {
    const res = await fetch(
      `https://api.pinterest.com/v5/search/pins?query=${q}&count=8`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );
    if (!res.ok) return [];
    const json = await res.json();
    return (json.items || [])
      .map((pin) => ({
        id: pin.id,
        title: pin.title || pin.description?.slice(0, 60) || 'Pinterest',
        imageUrl:
          pin.media?.images?.['600x']?.url ||
          pin.media?.images?.['400x300']?.url ||
          pin.media?.images?.['236x']?.url,
        subtitle: 'Pinterest',
      }))
      .filter((p) => p.imageUrl);
  } catch {
    // CORS 또는 네트워크 오류 시 빈 배열 반환 → 다음 소스로 폴백
    return [];
  }
}

// ── API 2: 장르별 전용 API ─────────────────────────────────────────────────────
// 반환값: { need: null | 'omdb', results: [] }
async function searchByGenre(genreId, query, genreLabel) {
  const q = encodeURIComponent(query.trim());

  // 애니메이션 → Jikan (MyAnimeList) — 무료, 키 불필요
  if (isAnimeGenre(genreId, genreLabel)) {
    try {
      const res = await fetch(
        `https://api.jikan.moe/v4/anime?q=${q}&limit=8&sfw=true`
      );
      const json = await res.json();
      return {
        need: null,
        results: (json.data || []).map((item) => ({
          id: item.mal_id,
          title: item.title,
          imageUrl: item.images?.jpg?.large_image_url || item.images?.jpg?.image_url,
          subtitle: item.year ? `${item.year}년` : item.type || '',
        })),
      };
    } catch {
      return { need: null, results: [] };
    }
  }

  // 책 → Open Library — 무료, 키 불필요
  if (genreId === 'book') {
    try {
      const res = await fetch(
        `https://openlibrary.org/search.json?title=${q}&limit=8&fields=key,title,author_name,cover_i,first_publish_year`
      );
      const json = await res.json();
      return {
        need: null,
        results: (json.docs || [])
          .filter((d) => d.cover_i)
          .slice(0, 8)
          .map((d) => ({
            id: d.key,
            title: d.title,
            imageUrl: `https://covers.openlibrary.org/b/id/${d.cover_i}-M.jpg`,
            subtitle: d.author_name?.[0] || '',
          })),
      };
    } catch {
      return { need: null, results: [] };
    }
  }

  // 영화/게임 → OMDB — 무료 API 키 필요
  if (genreId === 'movie' || genreId === 'game') {
    const apiKey =
      typeof window !== 'undefined' ? localStorage.getItem('omdb_api_key') : null;
    if (!apiKey) return { need: 'omdb', results: [] };
    try {
      const type = genreId === 'movie' ? '&type=movie' : '';
      const res = await fetch(
        `https://www.omdbapi.com/?s=${q}&apikey=${apiKey}${type}`
      );
      const json = await res.json();
      if (json.Response === 'False') return { need: null, results: [] };
      return {
        need: null,
        results: (json.Search || []).map((item) => ({
          id: item.imdbID,
          title: item.Title,
          imageUrl: item.Poster !== 'N/A' ? item.Poster : null,
          subtitle: item.Year || '',
        })),
      };
    } catch {
      return { need: null, results: [] };
    }
  }

  return { need: null, results: [] };
}

// ── API 3: Google Custom Search (Fallback) ────────────────────────────────────
// Google Cloud Console에서 API 키 + Custom Search Engine ID(cx)가 필요합니다.
async function searchGoogle(query, key, cx) {
  const q = encodeURIComponent(query.trim());
  try {
    const res = await fetch(
      `https://www.googleapis.com/customsearch/v1?q=${q}&searchType=image&num=8&key=${key}&cx=${cx}`
    );
    if (!res.ok) return [];
    const json = await res.json();
    return (json.items || []).map((item, i) => ({
      id: `g-${i}`,
      title: item.title || '',
      imageUrl: item.link,
      subtitle: item.displayLink || 'Google',
    }));
  } catch {
    return [];
  }
}

// ── 자격증명 경고 UI 컴포넌트 ─────────────────────────────────────────────────
function CredentialWarning({ type, children }) {
  const colors = {
    pinterest: { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700', btn: 'bg-rose-500 hover:bg-rose-600', input: 'border-rose-300 focus:ring-rose-400' },
    google:    { bg: 'bg-blue-50',  border: 'border-blue-200',  text: 'text-blue-700',  btn: 'bg-blue-500 hover:bg-blue-600',  input: 'border-blue-300 focus:ring-blue-400' },
    omdb:      { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', btn: 'bg-amber-500 hover:bg-amber-600', input: 'border-amber-300 focus:ring-amber-400' },
  };
  const c = colors[type];
  return (
    <div className={`p-3 ${c.bg} border ${c.border} rounded-xl text-xs ${c.text}`}>
      {children(c)}
    </div>
  );
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────────────────────
export function PosterSearch({ genreId, genreLabel = '', title, currentUrl, onSelect, onClose }) {
  const [query, setQuery] = useState(title || '');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState('search');
  const [urlInput, setUrlInput] = useState(currentUrl || '');

  // 자격증명 (localStorage에서 초기화)
  const [pinterestToken, setPinterestToken] = useState('');
  const [googleKey, setGoogleKey] = useState('');
  const [googleCx, setGoogleCx] = useState('');
  const [omdbKey, setOmdbKey] = useState('');

  // 경고 표시 상태
  const [needsPinterest, setNeedsPinterest] = useState(false);
  const [needsGoogle, setNeedsGoogle] = useState(false);
  const [needsOmdb, setNeedsOmdb] = useState(false);

  // 자격증명 입력 패널 표시 상태
  const [showPinterestInput, setShowPinterestInput] = useState(false);
  const [showGoogleInput, setShowGoogleInput] = useState(false);
  const [showOmdbInput, setShowOmdbInput] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPinterestToken(localStorage.getItem('pinterest_access_token') || '');
      setGoogleKey(localStorage.getItem('google_search_key') || '');
      setGoogleCx(localStorage.getItem('google_search_cx') || '');
      setOmdbKey(localStorage.getItem('omdb_api_key') || '');
    }
  }, []);

  // ── 검색 실행 (우선순위: Pinterest → 장르별 → Google) ──────────────────────
  const doSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setNeedsPinterest(false);
    setNeedsGoogle(false);
    setNeedsOmdb(false);

    // 1. Pinterest (primary)
    const storedToken =
      typeof window !== 'undefined' ? localStorage.getItem('pinterest_access_token') : null;
    if (storedToken) {
      const pinResults = await searchPinterest(query, storedToken);
      if (pinResults.length > 0) {
        setResults(pinResults);
        setLoading(false);
        return;
      }
    } else {
      setNeedsPinterest(true);
    }

    // 2. 장르별 전용 API
    const { need, results: genreResults } = await searchByGenre(genreId, query, genreLabel);
    if (need === 'omdb') {
      setNeedsOmdb(true);
    } else if (genreResults.length > 0) {
      setResults(genreResults);
      setLoading(false);
      return;
    }

    // 3. Google Custom Search (fallback)
    const storedKey =
      typeof window !== 'undefined' ? localStorage.getItem('google_search_key') : null;
    const storedCx =
      typeof window !== 'undefined' ? localStorage.getItem('google_search_cx') : null;
    if (storedKey && storedCx) {
      const gResults = await searchGoogle(query, storedKey, storedCx);
      if (gResults.length > 0) {
        setResults(gResults);
        setLoading(false);
        return;
      }
    } else {
      setNeedsGoogle(true);
    }

    setResults([]);
    setLoading(false);
  };

  // 마운트 시 자동 검색 (title이 있을 때)
  useEffect(() => {
    if (title) doSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── 자격증명 저장 핸들러 ───────────────────────────────────────────────────
  const savePinterestToken = () => {
    localStorage.setItem('pinterest_access_token', pinterestToken);
    setShowPinterestInput(false);
    doSearch();
  };

  const saveGoogleKeys = () => {
    localStorage.setItem('google_search_key', googleKey);
    localStorage.setItem('google_search_cx', googleCx);
    setShowGoogleInput(false);
    doSearch();
  };

  const saveOmdbKey = () => {
    localStorage.setItem('omdb_api_key', omdbKey);
    setShowOmdbInput(false);
    doSearch();
  };

  const noResultsAfterSearch =
    results.length === 0 && !loading && query &&
    !needsPinterest && !needsGoogle && !needsOmdb;

  return (
    <div className="flex flex-col gap-3">
      {/* ── 탭 ──────────────────────────────────────────────────────────────── */}
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

      {/* ── 자동 검색 탭 ─────────────────────────────────────────────────────── */}
      {tab === 'search' && (
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

          {/* ── Pinterest 토큰 안내 ────────────────────────────────────────── */}
          {needsPinterest && (
            <CredentialWarning type="pinterest">
              {(c) => (
                <>
                  <p className="font-medium mb-1 flex items-center gap-1">
                    <Key className="w-3 h-3" /> Pinterest 액세스 토큰이 필요합니다
                  </p>
                  <p className="mb-2">
                    <a
                      href="https://developers.pinterest.com/docs/getting-started/set-up-app/"
                      target="_blank"
                      rel="noreferrer"
                      className="underline inline-flex items-center gap-0.5"
                    >
                      Pinterest Developers <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                    에서 앱을 생성하고 액세스 토큰을 발급받으세요.
                  </p>
                  {showPinterestInput ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={pinterestToken}
                        onChange={(e) => setPinterestToken(e.target.value)}
                        placeholder="Bearer 토큰 입력..."
                        className={`flex-1 px-2 py-1 border ${c.input} rounded-lg focus:outline-none focus:ring-1 bg-white text-slate-800`}
                      />
                      <button
                        type="button"
                        onClick={savePinterestToken}
                        className={`px-2 py-1 ${c.btn} text-white rounded-lg text-xs transition-colors`}
                      >
                        저장
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowPinterestInput(true)}
                      className={`${c.text} underline font-medium`}
                    >
                      토큰 입력하기
                    </button>
                  )}
                </>
              )}
            </CredentialWarning>
          )}

          {/* ── OMDB 키 안내 ──────────────────────────────────────────────── */}
          {needsOmdb && (
            <CredentialWarning type="omdb">
              {(c) => (
                <>
                  <p className="font-medium mb-1 flex items-center gap-1">
                    <Key className="w-3 h-3" /> OMDB API 키가 필요합니다
                  </p>
                  <p className="mb-2">
                    영화/게임 검색은{' '}
                    <a
                      href="https://www.omdbapi.com/apikey.aspx"
                      target="_blank"
                      rel="noreferrer"
                      className="underline inline-flex items-center gap-0.5"
                    >
                      omdbapi.com <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                    에서 무료 키를 발급받으세요.
                  </p>
                  {showOmdbInput ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={omdbKey}
                        onChange={(e) => setOmdbKey(e.target.value)}
                        placeholder="API 키 입력..."
                        className={`flex-1 px-2 py-1 border ${c.input} rounded-lg focus:outline-none focus:ring-1 bg-white text-slate-800`}
                      />
                      <button
                        type="button"
                        onClick={saveOmdbKey}
                        className={`px-2 py-1 ${c.btn} text-white rounded-lg text-xs transition-colors`}
                      >
                        저장
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowOmdbInput(true)}
                      className={`${c.text} underline font-medium`}
                    >
                      키 입력하기
                    </button>
                  )}
                </>
              )}
            </CredentialWarning>
          )}

          {/* ── Google Custom Search 키 안내 ──────────────────────────────── */}
          {needsGoogle && (
            <CredentialWarning type="google">
              {(c) => (
                <>
                  <p className="font-medium mb-1 flex items-center gap-1">
                    <Key className="w-3 h-3" /> Google Custom Search 설정이 필요합니다
                  </p>
                  <p className="mb-2">
                    <a
                      href="https://developers.google.com/custom-search/v1/introduction"
                      target="_blank"
                      rel="noreferrer"
                      className="underline inline-flex items-center gap-0.5"
                    >
                      Google Cloud <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                    에서 API 키를 발급하고,{' '}
                    <a
                      href="https://programmablesearchengine.google.com/"
                      target="_blank"
                      rel="noreferrer"
                      className="underline inline-flex items-center gap-0.5"
                    >
                      Programmable Search <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                    에서 CX ID를 생성하세요.
                  </p>
                  {showGoogleInput ? (
                    <div className="flex flex-col gap-1.5">
                      <input
                        type="text"
                        value={googleKey}
                        onChange={(e) => setGoogleKey(e.target.value)}
                        placeholder="API 키 입력..."
                        className={`w-full px-2 py-1 border ${c.input} rounded-lg focus:outline-none focus:ring-1 bg-white text-slate-800`}
                      />
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={googleCx}
                          onChange={(e) => setGoogleCx(e.target.value)}
                          placeholder="CX (검색엔진 ID) 입력..."
                          className={`flex-1 px-2 py-1 border ${c.input} rounded-lg focus:outline-none focus:ring-1 bg-white text-slate-800`}
                        />
                        <button
                          type="button"
                          onClick={saveGoogleKeys}
                          className={`px-2 py-1 ${c.btn} text-white rounded-lg text-xs transition-colors shrink-0`}
                        >
                          저장
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowGoogleInput(true)}
                      className={`${c.text} underline font-medium`}
                    >
                      키 입력하기
                    </button>
                  )}
                </>
              )}
            </CredentialWarning>
          )}

          {/* ── 검색 결과 그리드 ───────────────────────────────────────────── */}
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

          {noResultsAfterSearch && (
            <p className="text-center text-xs text-slate-400 py-3">
              검색 결과가 없습니다.
            </p>
          )}
        </>
      )}

      {/* ── URL 직접 입력 탭 ─────────────────────────────────────────────────── */}
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

      {/* ── 포스터 제거 ──────────────────────────────────────────────────────── */}
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
