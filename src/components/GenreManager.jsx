'use client';
// ──────────────────────────────────────────────────────────────────────────────
// components/GenreManager.jsx
// 장르 관리 모달 컴포넌트.
// - 장르 목록 조회
// - 장르 추가 / 수정(이름·이모지·색상·세부 평가 항목) / 삭제
// - 세부 평가 항목(evalItems) 추가·삭제·이름 수정
// - 변경 내용은 useGenres 훅을 통해 localStorage에 자동 저장됩니다.
// ──────────────────────────────────────────────────────────────────────────────
import { useState, useCallback } from 'react';
import {
  X, Plus, Trash2, Pencil, ChevronDown, ChevronUp,
  RotateCcw, Check, GripVertical,
} from 'lucide-react';
import { useGenres } from '@/hooks/useGenres';

// ─── 색상 샘플 버튼 ────────────────────────────────────────────────────────────
function ColorDot({ preset, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={preset.color}
      className={`w-7 h-7 rounded-full transition-all duration-150 ${preset.activeBg} ${
        selected ? 'ring-2 ring-offset-2 ring-slate-700 scale-110' : 'hover:scale-110'
      }`}
    />
  );
}

// ─── 세부 평가 항목 편집 행 ────────────────────────────────────────────────────
function EvalItemRow({ item, index, onRename, onDelete, total }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(item);

  const commit = () => {
    const trimmed = val.trim();
    if (trimmed && trimmed !== item) onRename(index, trimmed);
    else setVal(item); // 빈 값이면 원래 이름으로 복원
    setEditing(false);
  };

  return (
    <div className="flex items-center gap-2 group">
      {/* 순서 표시 (드래그 기능은 향후 확장, 현재는 시각적 힌트) */}
      <GripVertical className="w-4 h-4 text-slate-300 shrink-0" />

      {editing ? (
        <input
          autoFocus
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit();
            if (e.key === 'Escape') { setVal(item); setEditing(false); }
          }}
          className="flex-1 px-2 py-1 text-sm border border-indigo-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      ) : (
        <span
          className="flex-1 text-sm text-slate-700 px-2 py-1 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors"
          onClick={() => setEditing(true)}
        >
          {item}
        </span>
      )}

      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {/* 이름 수정 버튼 */}
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="p-1 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          aria-label="항목 이름 수정"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        {/* 삭제 버튼 (최소 1개 유지) */}
        <button
          type="button"
          onClick={() => onDelete(index)}
          disabled={total <= 1}
          className="p-1 rounded-md hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="항목 삭제"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// ─── 장르 카드 (접힘/펼침 인라인 편집) ─────────────────────────────────────────
function GenreCard({ genre, onSave, onDelete, isOnly }) {
  const { COLOR_PRESETS } = useGenres();
  const [expanded, setExpanded] = useState(false);

  // 편집 폼 상태
  const [label, setLabel] = useState(genre.label);
  const [emoji, setEmoji] = useState(genre.emoji);
  const [colorPreset, setColorPreset] = useState(
    COLOR_PRESETS.find((p) => p.color === genre.color) || COLOR_PRESETS[0]
  );
  const [evalItems, setEvalItems] = useState([...(genre.defaultItems || [])]);
  const [newItemInput, setNewItemInput] = useState('');
  const [dirty, setDirty] = useState(false);

  // 변경 감지 헬퍼
  const markDirty = (fn) => { fn(); setDirty(true); };

  const handleAddItem = () => {
    const trimmed = newItemInput.trim();
    if (!trimmed || evalItems.includes(trimmed)) return;
    markDirty(() => setEvalItems((prev) => [...prev, trimmed]));
    setNewItemInput('');
  };

  const handleRenameItem = useCallback((index, newName) => {
    markDirty(() =>
      setEvalItems((prev) => prev.map((it, i) => (i === index ? newName : it)))
    );
  }, []);

  const handleDeleteItem = useCallback((index) => {
    markDirty(() => setEvalItems((prev) => prev.filter((_, i) => i !== index)));
  }, []);

  const handleSave = () => {
    if (!label.trim()) return;
    onSave(genre.id, {
      label: label.trim(),
      emoji,
      ...colorPreset,
      defaultItems: evalItems,
    });
    setDirty(false);
    setExpanded(false);
  };

  const handleCancel = () => {
    // 원래 값으로 복원
    setLabel(genre.label);
    setEmoji(genre.emoji);
    setColorPreset(COLOR_PRESETS.find((p) => p.color === genre.color) || COLOR_PRESETS[0]);
    setEvalItems([...(genre.defaultItems || [])]);
    setDirty(false);
    setExpanded(false);
  };

  return (
    <div className={`rounded-xl border-2 overflow-hidden transition-all duration-200 ${
      expanded ? 'border-indigo-200 shadow-md' : 'border-slate-100'
    }`}>
      {/* 장르 요약 행 */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white">
        {/* 색상 인디케이터 */}
        <div className={`w-3 h-3 rounded-full shrink-0 ${genre.dot}`} />

        <span className="text-lg">{genre.emoji}</span>

        <span className="flex-1 font-medium text-slate-800 text-sm">{genre.label}</span>

        {/* 평가 항목 미리보기 */}
        <span className="hidden sm:block text-xs text-slate-400 mr-2">
          {(genre.defaultItems || []).join(' · ')}
        </span>

        {/* 수정 토글 */}
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className={`p-1.5 rounded-lg transition-colors text-xs flex items-center gap-1 ${
            expanded
              ? 'bg-indigo-50 text-indigo-600'
              : 'hover:bg-slate-100 text-slate-400 hover:text-slate-700'
          }`}
          aria-label={expanded ? '접기' : '수정'}
        >
          <Pencil className="w-3.5 h-3.5" />
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {/* 삭제 버튼 (유일한 장르는 삭제 불가) */}
        <button
          type="button"
          onClick={() => onDelete(genre.id)}
          disabled={isOnly}
          className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-300 hover:text-rose-500 transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
          aria-label="장르 삭제"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 인라인 편집 폼 */}
      {expanded && (
        <div className="px-4 pb-4 pt-2 bg-slate-50 border-t border-slate-100 flex flex-col gap-4">
          {/* 이름 + 이모지 */}
          <div className="flex gap-2">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">이모지</label>
              <input
                type="text"
                value={emoji}
                onChange={(e) => { setEmoji(e.target.value.slice(-2) || emoji); setDirty(true); }}
                className="w-14 text-center px-2 py-2 text-xl rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                maxLength={2}
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-500 mb-1">장르 이름</label>
              <input
                type="text"
                value={label}
                onChange={(e) => { setLabel(e.target.value); setDirty(true); }}
                placeholder="장르 이름"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-sm text-slate-800"
              />
            </div>
          </div>

          {/* 색상 선택 */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-2">색상</label>
            <div className="flex flex-wrap gap-2">
              {COLOR_PRESETS.map((preset) => (
                <ColorDot
                  key={preset.color}
                  preset={preset}
                  selected={colorPreset.color === preset.color}
                  onClick={() => { setColorPreset(preset); setDirty(true); }}
                />
              ))}
            </div>
          </div>

          {/* 세부 평가 항목 */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-2">
              세부 평가 항목
              <span className="ml-1 text-slate-400">({evalItems.length}개)</span>
            </label>

            <div className="flex flex-col gap-1 mb-2">
              {evalItems.map((item, i) => (
                <EvalItemRow
                  key={`${item}-${i}`}
                  item={item}
                  index={i}
                  onRename={handleRenameItem}
                  onDelete={handleDeleteItem}
                  total={evalItems.length}
                />
              ))}
            </div>

            {/* 새 항목 추가 */}
            <div className="flex gap-2 mt-2">
              <input
                type="text"
                value={newItemInput}
                onChange={(e) => setNewItemInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { e.preventDefault(); handleAddItem(); }
                }}
                placeholder="새 항목 이름 입력..."
                className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              />
              <button
                type="button"
                onClick={handleAddItem}
                className="px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                추가
              </button>
            </div>
          </div>

          {/* 저장 / 취소 */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 py-2 rounded-lg border border-slate-200 text-slate-600 text-sm font-medium hover:bg-white transition-colors"
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!dirty || !label.trim()}
              className="flex-1 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1"
            >
              <Check className="w-3.5 h-3.5" />
              저장
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── 새 장르 추가 폼 ────────────────────────────────────────────────────────────
function AddGenreForm({ onAdd, onCancel }) {
  const { COLOR_PRESETS } = useGenres();
  const [label, setLabel] = useState('');
  const [emoji, setEmoji] = useState('🏷️');
  const [colorPreset, setColorPreset] = useState(COLOR_PRESETS[8]); // indigo 기본값
  const [evalItems, setEvalItems] = useState(['항목1', '항목2', '항목3', '항목4']);
  const [newItemInput, setNewItemInput] = useState('');

  const handleAddItem = () => {
    const trimmed = newItemInput.trim();
    if (!trimmed || evalItems.includes(trimmed)) return;
    setEvalItems((prev) => [...prev, trimmed]);
    setNewItemInput('');
  };

  const handleSubmit = () => {
    if (!label.trim()) return;
    onAdd({
      label: label.trim(),
      emoji,
      ...colorPreset,
      defaultItems: evalItems.filter(Boolean),
    });
  };

  return (
    <div className="rounded-xl border-2 border-indigo-200 bg-indigo-50/50 p-4 flex flex-col gap-4">
      <h4 className="text-sm font-semibold text-indigo-700">새 장르 추가</h4>

      {/* 이름 + 이모지 */}
      <div className="flex gap-2">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">이모지</label>
          <input
            type="text"
            value={emoji}
            onChange={(e) => setEmoji(e.target.value.slice(-2) || emoji)}
            className="w-14 text-center px-2 py-2 text-xl rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            maxLength={2}
          />
        </div>
        <div className="flex-1">
          <label className="block text-xs font-medium text-slate-500 mb-1">장르 이름 *</label>
          <input
            autoFocus
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="예: 드라마, 카페, 운동..."
            className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-sm text-slate-800"
          />
        </div>
      </div>

      {/* 색상 선택 */}
      <div>
        <label className="block text-xs font-medium text-slate-500 mb-2">색상</label>
        <div className="flex flex-wrap gap-2">
          {COLOR_PRESETS.map((preset) => (
            <ColorDot
              key={preset.color}
              preset={preset}
              selected={colorPreset.color === preset.color}
              onClick={() => setColorPreset(preset)}
            />
          ))}
        </div>
      </div>

      {/* 세부 평가 항목 */}
      <div>
        <label className="block text-xs font-medium text-slate-500 mb-2">
          세부 평가 항목 <span className="text-slate-400">({evalItems.length}개)</span>
        </label>
        <div className="flex flex-col gap-1 mb-2">
          {evalItems.map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="flex-1 text-sm text-slate-700 px-2 py-1">{item}</span>
              <button
                type="button"
                onClick={() => setEvalItems((prev) => prev.filter((_, idx) => idx !== i))}
                disabled={evalItems.length <= 1}
                className="p-1 rounded-md hover:bg-rose-50 text-slate-300 hover:text-rose-500 transition-colors disabled:opacity-20"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newItemInput}
            onChange={(e) => setNewItemInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddItem(); } }}
            placeholder="항목 추가..."
            className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          />
          <button
            type="button"
            onClick={handleAddItem}
            className="px-3 py-1.5 bg-slate-200 text-slate-700 text-sm rounded-lg hover:bg-slate-300 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 추가 / 취소 */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2 rounded-lg border border-slate-200 text-slate-600 text-sm font-medium hover:bg-white transition-colors"
        >
          취소
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!label.trim()}
          className="flex-1 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          장르 추가
        </button>
      </div>
    </div>
  );
}

// ─── 메인: 장르 관리 모달 ────────────────────────────────────────────────────────
export function GenreManager({ onClose }) {
  const { genres, addGenre, updateGenre, deleteGenre, resetGenres } = useGenres();
  const [showAddForm, setShowAddForm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null); // 삭제 확인 대상 id
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleAdd = (genre) => {
    addGenre(genre);
    setShowAddForm(false);
  };

  const handleDelete = (id) => {
    setDeleteConfirm(id);
  };

  const confirmDelete = () => {
    if (deleteConfirm) {
      deleteGenre(deleteConfirm);
      setDeleteConfirm(null);
    }
  };

  const handleReset = () => {
    resetGenres();
    setShowResetConfirm(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* 백드롭 */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* 모달 */}
      <div className="relative w-full sm:max-w-lg bg-white sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden max-h-[95dvh] flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-800">장르 관리</h2>
            <p className="text-xs text-slate-400 mt-0.5">장르와 세부 평가 항목을 자유롭게 편집하세요</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 스크롤 영역 */}
        <div className="overflow-y-auto flex-1 px-4 py-4 flex flex-col gap-3">
          {/* 장르 카드 목록 */}
          {genres.map((genre) => (
            <GenreCard
              key={genre.id}
              genre={genre}
              onSave={updateGenre}
              onDelete={handleDelete}
              isOnly={genres.length === 1}
            />
          ))}

          {/* 새 장르 추가 폼 or 버튼 */}
          {showAddForm ? (
            <AddGenreForm onAdd={handleAdd} onCancel={() => setShowAddForm(false)} />
          ) : (
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="w-full py-3 rounded-xl border-2 border-dashed border-slate-200 text-slate-500 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 transition-all duration-150 flex items-center justify-center gap-2 text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              새 장르 추가
            </button>
          )}
        </div>

        {/* 푸터: 기본값 초기화 버튼 */}
        <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between shrink-0 bg-slate-50">
          <button
            type="button"
            onClick={() => setShowResetConfirm(true)}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-rose-500 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            기본값으로 초기화
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-xl hover:bg-indigo-700 transition-colors font-medium"
          >
            완료
          </button>
        </div>
      </div>

      {/* 삭제 확인 다이얼로그 */}
      {deleteConfirm && (
        <div className="absolute inset-0 flex items-center justify-center p-4 z-10">
          <div className="absolute inset-0 bg-black/20" onClick={() => setDeleteConfirm(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-xs w-full">
            <h3 className="text-base font-bold text-slate-800 mb-1">장르 삭제</h3>
            <p className="text-sm text-slate-500 mb-5">
              이 장르를 삭제할까요?<br />
              <span className="text-amber-600 font-medium">해당 장르로 기록된 노트는 유지되지만, 장르 정보가 표시되지 않을 수 있습니다.</span>
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-2 rounded-xl bg-rose-500 text-white text-sm font-medium hover:bg-rose-600 transition-colors"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 초기화 확인 다이얼로그 */}
      {showResetConfirm && (
        <div className="absolute inset-0 flex items-center justify-center p-4 z-10">
          <div className="absolute inset-0 bg-black/20" onClick={() => setShowResetConfirm(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-xs w-full">
            <h3 className="text-base font-bold text-slate-800 mb-1">기본값으로 초기화</h3>
            <p className="text-sm text-slate-500 mb-5">
              모든 장르를 기본값으로 되돌릴까요?<br />
              <span className="text-rose-600 font-medium">사용자가 추가·수정한 장르는 모두 삭제됩니다.</span>
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleReset}
                className="flex-1 py-2 rounded-xl bg-rose-500 text-white text-sm font-medium hover:bg-rose-600 transition-colors"
              >
                초기화
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
