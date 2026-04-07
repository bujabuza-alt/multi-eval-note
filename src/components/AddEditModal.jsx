'use client';
import { useState, useEffect, useMemo, useRef } from 'react';
import { X, Tag, Plus, BarChart2, Hexagon } from 'lucide-react';
import { StarRating } from './StarRating';
import { ScoreVisualization } from './ScoreVisualization';

const makeDefaultForm = () => ({
  title: '',
  category: 'restaurant',
  rating: 0,
  date: new Date().toISOString().split('T')[0],
  memo: '',
  tags: [],
  scores: {},
  vizType: 'radar',
});

export function AddEditModal({ note, categories = [], tagLibrary = [], onSave, onClose }) {
  const [form, setForm] = useState(makeDefaultForm);
  const [tagInput, setTagInput] = useState('');
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const tagInputRef = useRef(null);

  // Ensure the form's category exists in the provided categories list
  const safeDefaultCategory = categories[0]?.id || 'restaurant';

  useEffect(() => {
    if (note) {
      setForm({
        title:    note.title    || '',
        category: note.category || safeDefaultCategory,
        rating:   note.rating   || 0,
        date:     note.date     || new Date().toISOString().split('T')[0],
        memo:     note.memo     || '',
        tags:     note.tags     || [],
        scores:   note.scores   || {},
        vizType:  note.vizType  || 'radar',
      });
    } else {
      setForm({ ...makeDefaultForm(), category: safeDefaultCategory });
    }
    setTagInput('');
  }, [note]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const currentCat = useMemo(
    () => categories.find((c) => c.id === form.category) || categories[0],
    [categories, form.category]
  );
  const evalItems = currentCat?.items || [];

  const avgScore = useMemo(() => {
    if (!evalItems.length) return null;
    const vals = evalItems.map((item) => form.scores?.[item] ?? 0);
    const filled = vals.filter((v) => v > 0);
    if (!filled.length) return null;
    return (vals.reduce((s, v) => s + v, 0) / vals.length).toFixed(1);
  }, [evalItems, form.scores]);

  const setScore = (item, value) =>
    set('scores', { ...form.scores, [item]: Number(value) });

  // Tag suggestions from library (not already added)
  const tagSuggestions = useMemo(() => {
    const q = tagInput.trim().replace(/^#/, '').toLowerCase();
    return tagLibrary.filter(
      (t) => !form.tags.includes(t) && (q === '' || t.toLowerCase().includes(q))
    );
  }, [tagLibrary, tagInput, form.tags]);

  const addTag = (raw = tagInput) => {
    const t = raw.trim().replace(/^#/, '');
    if (t && !form.tags.includes(t)) set('tags', [...form.tags, t]);
    setTagInput('');
    setShowTagSuggestions(false);
  };

  const removeTag = (tag) => set('tags', form.tags.filter((t) => t !== tag));

  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(); }
    if (e.key === 'Escape') setShowTagSuggestions(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    onSave(form);
    onClose();
  };

  const isEdit = Boolean(note?.id);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full sm:max-w-lg bg-white sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden max-h-[95dvh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <h2 className="text-lg font-bold text-slate-800">
            {isEdit ? '노트 수정' : '새 노트 추가'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex flex-col gap-5 p-6">

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              이름 <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="무엇을 기록할까요?"
              required
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-800 placeholder:text-slate-400"
            />
          </div>

          {/* Genre (장르) */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">장르</label>
            <div className="grid grid-cols-4 gap-2">
              {categories.map((cat) => {
                const isSelected = form.category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => set('category', cat.id)}
                    className={`flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl border-2 text-xs font-medium transition-all duration-150 ${
                      isSelected
                        ? `${cat.activeBg} ${cat.activeText} ${cat.activeBorder} shadow-md scale-[1.04]`
                        : `bg-white text-slate-500 border-slate-200 ${cat.hoverBg} ${cat.hoverBorder} hover:text-slate-700 hover:scale-[1.02]`
                    }`}
                  >
                    <span className="text-xl">{cat.emoji}</span>
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Overall Rating */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              종합 평점
              {form.rating > 0 && (
                <span className="ml-2 text-amber-500 font-semibold">{form.rating}점</span>
              )}
            </label>
            <StarRating value={form.rating} onChange={(v) => set('rating', v)} size="lg" />
          </div>

          {/* Detailed Evaluation */}
          {evalItems.length > 0 && (
            <div>
              {/* Section header */}
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-slate-700">
                  세부 평가
                  {avgScore !== null && (
                    <span
                      className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: (currentCat?.chartColor || '#6366f1') + '22',
                        color: currentCat?.chartColor || '#6366f1',
                      }}
                    >
                      평균 {avgScore} / 10
                    </span>
                  )}
                </label>

                {/* VizType toggle */}
                <div className="flex gap-0.5 p-0.5 bg-slate-100 rounded-lg">
                  <button
                    type="button"
                    onClick={() => set('vizType', 'radar')}
                    title="레이더 차트"
                    className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded-md font-medium transition-all ${
                      form.vizType === 'radar'
                        ? 'bg-white text-indigo-600 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <Hexagon className="w-3.5 h-3.5" />
                    레이더
                  </button>
                  <button
                    type="button"
                    onClick={() => set('vizType', 'bars')}
                    title="막대 그래프"
                    className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded-md font-medium transition-all ${
                      form.vizType === 'bars'
                        ? 'bg-white text-indigo-600 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <BarChart2 className="w-3.5 h-3.5" />
                    막대
                  </button>
                </div>
              </div>

              {/* Live preview */}
              {avgScore !== null && (
                <div className="mb-4 p-3 bg-slate-50 rounded-xl flex justify-center">
                  <ScoreVisualization
                    items={evalItems}
                    scores={form.scores}
                    vizType={form.vizType}
                    color={currentCat?.chartColor || '#6366f1'}
                    size={160}
                    compact={false}
                    showAvg={false}
                  />
                </div>
              )}

              {/* Sliders */}
              <div className="flex flex-col gap-3">
                {evalItems.map((item) => {
                  const score = form.scores?.[item] ?? 0;
                  return (
                    <div key={item} className="flex items-center gap-3">
                      <span className="text-xs text-slate-600 w-14 shrink-0 text-right">{item}</span>
                      <input
                        type="range"
                        min="0"
                        max="10"
                        step="1"
                        value={score}
                        onChange={(e) => setScore(item, e.target.value)}
                        className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer"
                        style={{ accentColor: currentCat?.chartColor || '#6366f1' }}
                      />
                      <span
                        className="text-sm font-bold w-6 text-right tabular-nums"
                        style={{ color: score > 0 ? (currentCat?.chartColor || '#6366f1') : '#94a3b8' }}
                      >
                        {score}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">날짜</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => set('date', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-800"
            />
          </div>

          {/* Memo */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">메모</label>
            <textarea
              value={form.memo}
              onChange={(e) => set('memo', e.target.value)}
              placeholder="느낌, 특징, 다음에 기억할 것들..."
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-800 placeholder:text-slate-400 resize-none"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">태그</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent">
                  <Tag className="w-4 h-4 text-slate-400 shrink-0" />
                  <input
                    ref={tagInputRef}
                    type="text"
                    value={tagInput}
                    onChange={(e) => { setTagInput(e.target.value); setShowTagSuggestions(true); }}
                    onFocus={() => setShowTagSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowTagSuggestions(false), 150)}
                    onKeyDown={handleTagKeyDown}
                    placeholder="태그 입력 후 Enter"
                    className="flex-1 focus:outline-none text-sm text-slate-800 placeholder:text-slate-400"
                  />
                </div>
                {/* Suggestions dropdown */}
                {showTagSuggestions && tagSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-10 max-h-36 overflow-y-auto">
                    {tagSuggestions.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onMouseDown={() => addTag(t)}
                        className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                      >
                        #{t}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => addTag()}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-600 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {form.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {form.tags.map((tag) => (
                  <span
                    key={tag}
                    className="flex items-center gap-1 px-2.5 py-1 bg-indigo-50 text-indigo-700 text-xs rounded-full"
                  >
                    #{tag}
                    <button type="button" onClick={() => removeTag(tag)} className="hover:text-indigo-900">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors shadow-sm"
            >
              {isEdit ? '저장' : '추가'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
