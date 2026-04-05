'use client';
import { useState, useEffect } from 'react';
import { X, Tag, Plus } from 'lucide-react';
import { CATEGORIES } from '@/lib/categories';
import { StarRating } from './StarRating';

const DEFAULT_FORM = {
  title: '',
  category: 'restaurant',
  rating: 0,
  date: new Date().toISOString().split('T')[0],
  memo: '',
  tags: [],
};

export function AddEditModal({ note, onSave, onClose }) {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (note) {
      setForm({
        title: note.title || '',
        category: note.category || 'restaurant',
        rating: note.rating || 0,
        date: note.date || new Date().toISOString().split('T')[0],
        memo: note.memo || '',
        tags: note.tags || [],
      });
    } else {
      setForm(DEFAULT_FORM);
    }
    setTagInput('');
  }, [note]);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const addTag = () => {
    const t = tagInput.trim().replace(/^#/, '');
    if (t && !form.tags.includes(t)) {
      set('tags', [...form.tags, t]);
    }
    setTagInput('');
  };

  const removeTag = (tag) => set('tags', form.tags.filter((t) => t !== tag));

  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    }
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
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full sm:max-w-lg bg-white sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden max-h-[95dvh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">
            {isEdit ? '노트 수정' : '새 노트 추가'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form */}
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

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">카테고리</label>
            <div className="grid grid-cols-4 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => set('category', cat.id)}
                  className={`flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl border text-xs font-medium transition-all ${
                    form.category === cat.id
                      ? `${cat.bg} ${cat.text} ${cat.border} border-2`
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-lg">{cat.emoji}</span>
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Rating */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              평점
              {form.rating > 0 && (
                <span className="ml-2 text-amber-500 font-semibold">{form.rating}점</span>
              )}
            </label>
            <StarRating value={form.rating} onChange={(v) => set('rating', v)} size="lg" />
          </div>

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
              <div className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent">
                <Tag className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  placeholder="태그 입력 후 Enter"
                  className="flex-1 focus:outline-none text-sm text-slate-800 placeholder:text-slate-400"
                />
              </div>
              <button
                type="button"
                onClick={addTag}
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
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="hover:text-indigo-900"
                    >
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
