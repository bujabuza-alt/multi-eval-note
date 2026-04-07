'use client';
import { useState, useMemo } from 'react';
import { X, Plus, Trash2, Pencil, Check, Tag } from 'lucide-react';
import { COLOR_PALETTES } from '@/hooks/useCategories';

// ── Inline-editable genre card ──────────────────────────────────────────────

function GenreCard({ cat, notesCount, onUpdate, onDelete }) {
  const [label, setLabel] = useState(cat.label);
  const [emoji, setEmoji] = useState(cat.emoji);
  const [colorName, setColorName] = useState(cat.color || 'slate');
  const [newItem, setNewItem] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isDirty =
    label !== cat.label || emoji !== cat.emoji || colorName !== (cat.color || 'slate');

  const saveBasic = () => {
    if (!label.trim()) return;
    const palette = COLOR_PALETTES.find((p) => p.name === colorName) || COLOR_PALETTES[0];
    onUpdate({ ...palette, label: label.trim(), emoji: emoji.trim() || '📌', color: colorName });
    setEditingName(false);
  };

  const addItem = () => {
    const t = newItem.trim();
    if (!t || cat.items.includes(t)) return;
    onUpdate({ items: [...cat.items, t] });
    setNewItem('');
  };

  const removeItem = (item) => {
    if (cat.items.length <= 1) return;
    onUpdate({ items: cat.items.filter((i) => i !== item) });
  };

  const handleItemKey = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); addItem(); }
  };

  const palette = COLOR_PALETTES.find((p) => p.name === colorName) || COLOR_PALETTES[0];

  return (
    <div className={`rounded-2xl border-2 p-4 flex flex-col gap-3 ${palette.border} bg-white`}>
      {/* Row 1: emoji + name + delete */}
      <div className="flex items-center gap-2">
        {/* Emoji */}
        <input
          type="text"
          value={emoji}
          onChange={(e) => setEmoji(e.target.value)}
          onBlur={saveBasic}
          maxLength={4}
          className="w-10 text-center text-xl bg-transparent focus:outline-none focus:ring-2 focus:ring-indigo-400 rounded-lg"
          title="이모지 변경"
        />

        {/* Name */}
        {editingName ? (
          <input
            autoFocus
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onBlur={saveBasic}
            onKeyDown={(e) => e.key === 'Enter' && saveBasic()}
            className="flex-1 text-sm font-semibold text-slate-800 border-b-2 border-indigo-400 focus:outline-none bg-transparent"
          />
        ) : (
          <button
            onClick={() => setEditingName(true)}
            className="flex-1 text-left text-sm font-semibold text-slate-800 hover:text-indigo-600 transition-colors flex items-center gap-1 group"
          >
            {cat.label}
            <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-60 transition-opacity" />
          </button>
        )}

        {/* Save badge when name changed */}
        {isDirty && (
          <button
            onClick={saveBasic}
            className="p-1 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
            title="저장"
          >
            <Check className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Delete */}
        {confirmDelete ? (
          <div className="flex items-center gap-1">
            <span className="text-xs text-slate-500">삭제?</span>
            <button
              onClick={() => onDelete()}
              className="px-2 py-0.5 text-xs bg-rose-500 text-white rounded-lg hover:bg-rose-600"
            >
              확인
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="px-2 py-0.5 text-xs bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200"
            >
              취소
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition-colors"
            title="장르 삭제"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Note count */}
      {notesCount > 0 && (
        <p className="text-xs text-slate-400">노트 {notesCount}개에서 사용 중</p>
      )}

      {/* Color palette */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-xs text-slate-500 mr-1">색상</span>
        {COLOR_PALETTES.map((p) => (
          <button
            key={p.name}
            onClick={() => {
              setColorName(p.name);
              const palette2 = COLOR_PALETTES.find((pp) => pp.name === p.name) || COLOR_PALETTES[0];
              onUpdate({ ...palette2, label: cat.label, emoji: cat.emoji, color: p.name });
            }}
            className={`w-5 h-5 rounded-full border-2 transition-transform hover:scale-110 ${
              colorName === p.name ? 'border-slate-800 scale-110' : 'border-transparent'
            }`}
            style={{ backgroundColor: p.swatch }}
            title={p.name}
          />
        ))}
      </div>

      {/* Evaluation items */}
      <div>
        <p className="text-xs font-medium text-slate-500 mb-1.5">세부평가 항목</p>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {cat.items.map((item) => (
            <span
              key={item}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${palette.bg} ${palette.text}`}
            >
              {item}
              <button
                onClick={() => removeItem(item)}
                className="opacity-60 hover:opacity-100 transition-opacity"
                title="항목 제거"
                disabled={cat.items.length <= 1}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-1.5">
          <input
            type="text"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyDown={handleItemKey}
            placeholder="새 항목 입력 후 Enter"
            maxLength={10}
            className="flex-1 text-xs px-3 py-1.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 placeholder:text-slate-400"
          />
          <button
            onClick={addItem}
            disabled={!newItem.trim()}
            className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors disabled:opacity-40"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Add new genre form ───────────────────────────────────────────────────────

function AddGenreForm({ onAdd }) {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState('');
  const [emoji, setEmoji] = useState('');
  const [colorName, setColorName] = useState('indigo');
  const [items, setItems] = useState(['항목1', '항목2', '항목3']);
  const [itemInput, setItemInput] = useState('');

  const reset = () => { setLabel(''); setEmoji(''); setColorName('indigo'); setItems(['항목1', '항목2', '항목3']); setItemInput(''); setOpen(false); };

  const addItem = () => {
    const t = itemInput.trim();
    if (t && !items.includes(t)) setItems([...items, t]);
    setItemInput('');
  };

  const submit = () => {
    if (!label.trim()) return;
    const palette = COLOR_PALETTES.find((p) => p.name === colorName) || COLOR_PALETTES[0];
    onAdd({ ...palette, label: label.trim(), emoji: emoji.trim() || '📌', color: colorName, items });
    reset();
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full py-3 rounded-2xl border-2 border-dashed border-slate-200 text-slate-500 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 transition-all text-sm font-medium flex items-center justify-center gap-2"
      >
        <Plus className="w-4 h-4" /> 새 장르 추가
      </button>
    );
  }

  const palette = COLOR_PALETTES.find((p) => p.name === colorName) || COLOR_PALETTES[0];

  return (
    <div className={`rounded-2xl border-2 ${palette.border} bg-white p-4 flex flex-col gap-3`}>
      <p className="text-sm font-bold text-slate-700">새 장르</p>

      <div className="flex gap-2">
        <input
          type="text"
          value={emoji}
          onChange={(e) => setEmoji(e.target.value)}
          placeholder="📌"
          maxLength={4}
          className="w-12 text-center text-xl border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="장르 이름"
          maxLength={12}
          className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-xs text-slate-500 mr-1">색상</span>
        {COLOR_PALETTES.map((p) => (
          <button
            key={p.name}
            onClick={() => setColorName(p.name)}
            className={`w-5 h-5 rounded-full border-2 transition-transform hover:scale-110 ${colorName === p.name ? 'border-slate-800 scale-110' : 'border-transparent'}`}
            style={{ backgroundColor: p.swatch }}
          />
        ))}
      </div>

      <div>
        <p className="text-xs font-medium text-slate-500 mb-1.5">세부평가 항목</p>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {items.map((item) => (
            <span key={item} className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${palette.bg} ${palette.text}`}>
              {item}
              <button onClick={() => setItems(items.filter((i) => i !== item))} disabled={items.length <= 1}>
                <X className="w-3 h-3 opacity-60 hover:opacity-100" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-1.5">
          <input
            type="text"
            value={itemInput}
            onChange={(e) => setItemInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addItem(); } }}
            placeholder="항목 추가 후 Enter"
            maxLength={10}
            className="flex-1 text-xs px-3 py-1.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 placeholder:text-slate-400"
          />
          <button onClick={addItem} className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600">
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <button onClick={reset} className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm hover:bg-slate-50 transition-colors">취소</button>
        <button onClick={submit} disabled={!label.trim()} className="flex-1 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-40">추가</button>
      </div>
    </div>
  );
}

// ── Tag management tab ───────────────────────────────────────────────────────

function TagManager({ notes, tagLibrary, onAddTag, onRemoveTag, onUpdateNotes }) {
  const [newTag, setNewTag] = useState('');
  const [renaming, setRenaming] = useState(null); // { old, newVal }

  // Merge library tags + tags from notes, compute usage
  const allTags = useMemo(() => {
    const usageMap = {};
    notes.forEach((n) => (n.tags || []).forEach((t) => { usageMap[t] = (usageMap[t] || 0) + 1; }));
    const allKeys = new Set([...tagLibrary, ...Object.keys(usageMap)]);
    return [...allKeys].sort().map((t) => ({ tag: t, count: usageMap[t] || 0, inLibrary: tagLibrary.includes(t) }));
  }, [notes, tagLibrary]);

  const handleAdd = () => {
    const t = newTag.trim().replace(/^#/, '');
    if (!t) return;
    onAddTag(t);
    setNewTag('');
  };

  const handleDelete = (tag) => {
    // Remove from all notes
    onUpdateNotes(notes.map((n) => ({ ...n, tags: (n.tags || []).filter((t) => t !== tag) })));
    // Remove from library
    onRemoveTag(tag);
  };

  const startRename = (tag) => setRenaming({ old: tag, newVal: tag });

  const commitRename = () => {
    if (!renaming) return;
    const { old, newVal } = renaming;
    const clean = newVal.trim().replace(/^#/, '');
    if (!clean || clean === old) { setRenaming(null); return; }
    // Update all notes
    onUpdateNotes(notes.map((n) => ({ ...n, tags: (n.tags || []).map((t) => (t === old ? clean : t)) })));
    // Update library
    if (tagLibrary.includes(old)) {
      onRemoveTag(old);
      onAddTag(clean);
    }
    setRenaming(null);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Add tag to library */}
      <div>
        <p className="text-xs font-medium text-slate-500 mb-2">태그 라이브러리에 추가</p>
        <div className="flex gap-2">
          <div className="flex-1 flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-xl focus-within:ring-2 focus-within:ring-indigo-400 focus-within:border-transparent">
            <Tag className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAdd(); } }}
              placeholder="새 태그 입력 후 Enter"
              className="flex-1 text-sm focus:outline-none text-slate-800 placeholder:text-slate-400"
            />
          </div>
          <button
            onClick={handleAdd}
            disabled={!newTag.trim()}
            className="px-3 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-40"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tag list */}
      {allTags.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-6">태그가 없습니다</p>
      ) : (
        <div className="flex flex-col gap-2">
          {allTags.map(({ tag, count, inLibrary }) => (
            <div key={tag} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-100">
              {renaming?.old === tag ? (
                <input
                  autoFocus
                  type="text"
                  value={renaming.newVal}
                  onChange={(e) => setRenaming({ ...renaming, newVal: e.target.value })}
                  onBlur={commitRename}
                  onKeyDown={(e) => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') setRenaming(null); }}
                  className="flex-1 text-sm font-medium bg-white px-2 py-0.5 rounded-lg border border-indigo-400 focus:outline-none"
                />
              ) : (
                <span className="flex-1 text-sm font-medium text-slate-700">
                  #{tag}
                  {inLibrary && <span className="ml-1 text-[10px] text-indigo-400 font-normal">라이브러리</span>}
                </span>
              )}

              <span className="text-xs text-slate-400 shrink-0">
                {count > 0 ? `노트 ${count}개` : '미사용'}
              </span>

              {renaming?.old === tag ? (
                <button onClick={commitRename} className="p-1 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700">
                  <Check className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  onClick={() => startRename(tag)}
                  className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors"
                  title="이름 변경"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                onClick={() => handleDelete(tag)}
                className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition-colors"
                title="태그 삭제"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main modal ───────────────────────────────────────────────────────────────

export function SettingsModal({
  categories,
  notes,
  tagLibrary,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  onAddTag,
  onRemoveTag,
  onUpdateNotes,
  onClose,
}) {
  const [tab, setTab] = useState('genres');

  const noteCounts = useMemo(() => {
    const map = {};
    notes.forEach((n) => { map[n.category] = (map[n.category] || 0) + 1; });
    return map;
  }, [notes]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full sm:max-w-lg bg-white sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden max-h-[92dvh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <h2 className="text-lg font-bold text-slate-800">설정</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex px-6 pt-3 gap-1 shrink-0 border-b border-slate-100">
          {[
            { key: 'genres', label: '장르 관리' },
            { key: 'tags',   label: '태그 관리' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-4 py-2 text-sm font-medium rounded-t-xl transition-colors ${
                tab === key
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-6 flex flex-col gap-3">
          {tab === 'genres' ? (
            <>
              {categories.map((cat) => (
                <GenreCard
                  key={cat.id}
                  cat={cat}
                  notesCount={noteCounts[cat.id] || 0}
                  onUpdate={(data) => onUpdateCategory(cat.id, data)}
                  onDelete={() => onDeleteCategory(cat.id)}
                />
              ))}
              <AddGenreForm onAdd={onAddCategory} />
            </>
          ) : (
            <TagManager
              notes={notes}
              tagLibrary={tagLibrary}
              onAddTag={onAddTag}
              onRemoveTag={onRemoveTag}
              onUpdateNotes={onUpdateNotes}
            />
          )}
        </div>
      </div>
    </div>
  );
}
