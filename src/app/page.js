'use client';
import { useState, useMemo, useCallback } from 'react';
import { Plus, Search, SlidersHorizontal, Star, BookOpen, Settings } from 'lucide-react';
import { useNotes } from '@/hooks/useNotes';
import { useCategories } from '@/hooks/useCategories';
import { NoteCard } from '@/components/NoteCard';
import { CategoryFilter } from '@/components/CategoryFilter';
import { AddEditModal } from '@/components/AddEditModal';
import { SettingsModal } from '@/components/SettingsModal';
import { EmptyState } from '@/components/EmptyState';

const SORT_OPTIONS = [
  { value: 'newest',      label: '최신순' },
  { value: 'oldest',      label: '오래된순' },
  { value: 'rating_desc', label: '평점 높은순' },
  { value: 'rating_asc',  label: '평점 낮은순' },
  { value: 'title',       label: '이름순' },
];

export default function HomePage() {
  const { notes, loaded: notesLoaded, addNote, updateNote, deleteNote, replaceAllNotes } = useNotes();
  const {
    categories, loaded: catsLoaded,
    addCategory, updateCategory, deleteCategory, getCategoryById,
    tagLibrary, addTagToLibrary, removeTagFromLibrary,
  } = useCategories();

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery]           = useState('');
  const [sort, setSort]                         = useState('newest');
  const [modalOpen, setModalOpen]               = useState(false);
  const [editingNote, setEditingNote]           = useState(null);
  const [deleteConfirm, setDeleteConfirm]       = useState(null);
  const [showSort, setShowSort]                 = useState(false);
  const [settingsOpen, setSettingsOpen]         = useState(false);

  const categoryCounts = useMemo(() => {
    const counts = {};
    categories.forEach((c) => { counts[c.id] = 0; });
    notes.forEach((n) => { if (counts[n.category] !== undefined) counts[n.category]++; });
    return counts;
  }, [notes, categories]);

  const filteredNotes = useMemo(() => {
    let result = [...notes];

    if (selectedCategory !== 'all') {
      result = result.filter((n) => n.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          (n.memo && n.memo.toLowerCase().includes(q)) ||
          (n.tags && n.tags.some((t) => t.toLowerCase().includes(q)))
      );
    }

    result.sort((a, b) => {
      switch (sort) {
        case 'newest':      return new Date(b.createdAt) - new Date(a.createdAt);
        case 'oldest':      return new Date(a.createdAt) - new Date(b.createdAt);
        case 'rating_desc': return (b.rating || 0) - (a.rating || 0);
        case 'rating_asc':  return (a.rating || 0) - (b.rating || 0);
        case 'title':       return a.title.localeCompare(b.title, 'ko');
        default:            return 0;
      }
    });

    return result;
  }, [notes, selectedCategory, searchQuery, sort]);

  const handleOpenAdd = () => { setEditingNote(null); setModalOpen(true); };
  const handleEdit    = (note) => { setEditingNote(note); setModalOpen(true); };

  const handleSave = (data) => {
    if (editingNote?.id) updateNote(editingNote.id, data);
    else addNote(data);
  };

  const handleDelete      = (id) => setDeleteConfirm(id);
  const confirmDelete     = () => { if (deleteConfirm) { deleteNote(deleteConfirm); setDeleteConfirm(null); } };

  // Bulk-update all notes (used by tag rename/delete in settings)
  const handleUpdateAllNotes = useCallback((updatedNotes) => {
    replaceAllNotes(updatedNotes);
  }, [replaceAllNotes]);

  const avgRating = useMemo(() => {
    const rated = notes.filter((n) => n.rating > 0);
    if (!rated.length) return 0;
    return (rated.reduce((s, n) => s + n.rating, 0) / rated.length).toFixed(1);
  }, [notes]);

  if (!notesLoaded || !catsLoaded) {
    return (
      <div className="flex items-center justify-center min-h-dvh">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-slate-100">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-indigo-600" />
                멀티 평가 노트
              </h1>
              {notes.length > 0 && (
                <p className="text-xs text-slate-400 mt-0.5">
                  총 {notes.length}개 기록 · 평균 <Star className="w-3 h-3 inline fill-amber-400 text-amber-400" /> {avgRating}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Settings */}
              <button
                onClick={() => setSettingsOpen(true)}
                className="p-2.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors"
                aria-label="설정"
              >
                <Settings className="w-4 h-4" />
              </button>

              {/* Add */}
              <button
                onClick={handleOpenAdd}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl font-medium text-sm hover:bg-indigo-700 transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                추가
              </button>
            </div>
          </div>

          {/* Search + Sort */}
          <div className="flex gap-2">
            <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-xl">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="검색..."
                className="flex-1 bg-transparent focus:outline-none text-sm text-slate-700 placeholder:text-slate-400"
              />
            </div>
            <div className="relative">
              <button
                onClick={() => setShowSort((v) => !v)}
                className={`p-2.5 rounded-xl border transition-colors ${
                  showSort
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-600'
                    : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                }`}
              >
                <SlidersHorizontal className="w-4 h-4" />
              </button>
              {showSort && (
                <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-40">
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => { setSort(opt.value); setShowSort(false); }}
                      className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                        sort === opt.value
                          ? 'text-indigo-600 bg-indigo-50 font-medium'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Category / Genre Filter */}
        <div className="max-w-3xl mx-auto px-4 pb-3">
          <CategoryFilter
            selected={selectedCategory}
            onSelect={setSelectedCategory}
            counts={categoryCounts}
            categories={categories}
          />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-6">
        {filteredNotes.length === 0 ? (
          <EmptyState filtered={notes.length > 0} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                categories={categories}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </main>

      {/* FAB (mobile) */}
      <button
        onClick={handleOpenAdd}
        className="fixed bottom-6 right-6 sm:hidden w-14 h-14 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition-colors flex items-center justify-center z-30"
        aria-label="새 노트 추가"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Add/Edit Modal */}
      {modalOpen && (
        <AddEditModal
          note={editingNote}
          categories={categories}
          tagLibrary={tagLibrary}
          onSave={handleSave}
          onClose={() => { setModalOpen(false); setEditingNote(null); }}
        />
      )}

      {/* Settings Modal */}
      {settingsOpen && (
        <SettingsModal
          categories={categories}
          notes={notes}
          tagLibrary={tagLibrary}
          onAddCategory={addCategory}
          onUpdateCategory={updateCategory}
          onDeleteCategory={deleteCategory}
          onAddTag={addTagToLibrary}
          onRemoveTag={removeTagFromLibrary}
          onUpdateNotes={handleUpdateAllNotes}
          onClose={() => setSettingsOpen(false)}
        />
      )}

      {/* Delete Confirm Dialog */}
      {deleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && setDeleteConfirm(null)}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold text-slate-800 mb-2">노트 삭제</h3>
            <p className="text-sm text-slate-500 mb-6">이 노트를 삭제할까요? 되돌릴 수 없어요.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-colors">취소</button>
              <button onClick={confirmDelete} className="flex-1 py-2.5 rounded-xl bg-rose-500 text-white font-medium hover:bg-rose-600 transition-colors">삭제</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
