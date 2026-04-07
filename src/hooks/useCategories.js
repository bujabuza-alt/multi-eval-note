'use client';
import { useState, useEffect, useCallback } from 'react';
import { CATEGORIES as DEFAULT_CATEGORIES } from '@/lib/categories';

const CAT_KEY = 'multi-eval-categories';
const TAG_KEY = 'multi-eval-tag-library';

// All available Tailwind color palettes for category customization.
// Full class names must appear here verbatim for JIT to include them.
export const COLOR_PALETTES = [
  { name: 'purple',  swatch: '#9333ea', bg: 'bg-purple-100',  text: 'text-purple-700',  border: 'border-purple-200',  dot: 'bg-purple-500',  activeBg: 'bg-purple-600',  activeText: 'text-white', activeBorder: 'border-purple-700',  hoverBg: 'hover:bg-purple-50',  hoverBorder: 'hover:border-purple-300',  chartColor: '#9333ea' },
  { name: 'rose',    swatch: '#e11d48', bg: 'bg-rose-100',    text: 'text-rose-700',    border: 'border-rose-200',    dot: 'bg-rose-500',    activeBg: 'bg-rose-600',    activeText: 'text-white', activeBorder: 'border-rose-700',    hoverBg: 'hover:bg-rose-50',    hoverBorder: 'hover:border-rose-300',    chartColor: '#e11d48' },
  { name: 'orange',  swatch: '#ea580c', bg: 'bg-orange-100',  text: 'text-orange-700',  border: 'border-orange-200',  dot: 'bg-orange-500',  activeBg: 'bg-orange-500',  activeText: 'text-white', activeBorder: 'border-orange-600',  hoverBg: 'hover:bg-orange-50',  hoverBorder: 'hover:border-orange-300',  chartColor: '#ea580c' },
  { name: 'amber',   swatch: '#d97706', bg: 'bg-amber-100',   text: 'text-amber-700',   border: 'border-amber-200',   dot: 'bg-amber-500',   activeBg: 'bg-amber-600',   activeText: 'text-white', activeBorder: 'border-amber-700',   hoverBg: 'hover:bg-amber-50',   hoverBorder: 'hover:border-amber-300',   chartColor: '#d97706' },
  { name: 'emerald', swatch: '#059669', bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500', activeBg: 'bg-emerald-600', activeText: 'text-white', activeBorder: 'border-emerald-700', hoverBg: 'hover:bg-emerald-50', hoverBorder: 'hover:border-emerald-300', chartColor: '#059669' },
  { name: 'teal',    swatch: '#0d9488', bg: 'bg-teal-100',    text: 'text-teal-700',    border: 'border-teal-200',    dot: 'bg-teal-500',    activeBg: 'bg-teal-600',    activeText: 'text-white', activeBorder: 'border-teal-700',    hoverBg: 'hover:bg-teal-50',    hoverBorder: 'hover:border-teal-300',    chartColor: '#0d9488' },
  { name: 'cyan',    swatch: '#0891b2', bg: 'bg-cyan-100',    text: 'text-cyan-700',    border: 'border-cyan-200',    dot: 'bg-cyan-500',    activeBg: 'bg-cyan-600',    activeText: 'text-white', activeBorder: 'border-cyan-700',    hoverBg: 'hover:bg-cyan-50',    hoverBorder: 'hover:border-cyan-300',    chartColor: '#0891b2' },
  { name: 'blue',    swatch: '#2563eb', bg: 'bg-blue-100',    text: 'text-blue-700',    border: 'border-blue-200',    dot: 'bg-blue-500',    activeBg: 'bg-blue-600',    activeText: 'text-white', activeBorder: 'border-blue-700',    hoverBg: 'hover:bg-blue-50',    hoverBorder: 'hover:border-blue-300',    chartColor: '#2563eb' },
  { name: 'indigo',  swatch: '#4f46e5', bg: 'bg-indigo-100',  text: 'text-indigo-700',  border: 'border-indigo-200',  dot: 'bg-indigo-500',  activeBg: 'bg-indigo-600',  activeText: 'text-white', activeBorder: 'border-indigo-700',  hoverBg: 'hover:bg-indigo-50',  hoverBorder: 'hover:border-indigo-300',  chartColor: '#4f46e5' },
  { name: 'violet',  swatch: '#7c3aed', bg: 'bg-violet-100',  text: 'text-violet-700',  border: 'border-violet-200',  dot: 'bg-violet-500',  activeBg: 'bg-violet-600',  activeText: 'text-white', activeBorder: 'border-violet-700',  hoverBg: 'hover:bg-violet-50',  hoverBorder: 'hover:border-violet-300',  chartColor: '#7c3aed' },
  { name: 'pink',    swatch: '#db2777', bg: 'bg-pink-100',    text: 'text-pink-700',    border: 'border-pink-200',    dot: 'bg-pink-500',    activeBg: 'bg-pink-600',    activeText: 'text-white', activeBorder: 'border-pink-700',    hoverBg: 'hover:bg-pink-50',    hoverBorder: 'hover:border-pink-300',    chartColor: '#db2777' },
  { name: 'slate',   swatch: '#475569', bg: 'bg-slate-100',   text: 'text-slate-700',   border: 'border-slate-200',   dot: 'bg-slate-500',   activeBg: 'bg-slate-700',   activeText: 'text-white', activeBorder: 'border-slate-800',   hoverBg: 'hover:bg-slate-100',  hoverBorder: 'hover:border-slate-400',   chartColor: '#475569' },
];

function paletteFor(colorName) {
  return COLOR_PALETTES.find((p) => p.name === colorName) || COLOR_PALETTES[0];
}

function normalise(cat) {
  const palette = paletteFor(cat.color || cat.name || 'slate');
  return {
    ...palette,
    ...cat,
    items: cat.items || cat.defaultItems || ['항목1', '항목2', '항목3'],
  };
}

export function useCategories() {
  const [categories, setCategories] = useState([]);
  const [tagLibrary, setTagLibrary] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(CAT_KEY);
      setCategories(stored ? JSON.parse(stored).map(normalise) : DEFAULT_CATEGORIES.map(normalise));
    } catch {
      setCategories(DEFAULT_CATEGORIES.map(normalise));
    }
    try {
      const storedTags = localStorage.getItem(TAG_KEY);
      setTagLibrary(storedTags ? JSON.parse(storedTags) : []);
    } catch {
      setTagLibrary([]);
    }
    setLoaded(true);
  }, []);

  const persistCats = useCallback((next) => {
    setCategories(next);
    try { localStorage.setItem(CAT_KEY, JSON.stringify(next)); } catch {}
  }, []);

  const persistTags = useCallback((next) => {
    setTagLibrary(next);
    try { localStorage.setItem(TAG_KEY, JSON.stringify(next)); } catch {}
  }, []);

  // ── Category CRUD ──────────────────────────────────────────────────────────

  const addCategory = useCallback((data) => {
    const palette = paletteFor(data.color || 'indigo');
    const cat = normalise({
      ...palette,
      ...data,
      id: `cat-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    });
    persistCats([...categories, cat]);
  }, [categories, persistCats]);

  const updateCategory = useCallback((id, data) => {
    persistCats(categories.map((c) => c.id === id ? normalise({ ...c, ...data }) : c));
  }, [categories, persistCats]);

  const deleteCategory = useCallback((id) => {
    persistCats(categories.filter((c) => c.id !== id));
  }, [categories, persistCats]);

  const getCategoryById = useCallback((id) => {
    return (
      categories.find((c) => c.id === id) ||
      categories[categories.length - 1] ||
      normalise(DEFAULT_CATEGORIES[DEFAULT_CATEGORIES.length - 1])
    );
  }, [categories]);

  // ── Tag library CRUD ───────────────────────────────────────────────────────

  const addTagToLibrary = useCallback((tag) => {
    const t = tag.trim().replace(/^#/, '');
    if (t && !tagLibrary.includes(t)) persistTags([...tagLibrary, t]);
  }, [tagLibrary, persistTags]);

  const removeTagFromLibrary = useCallback((tag) => {
    persistTags(tagLibrary.filter((t) => t !== tag));
  }, [tagLibrary, persistTags]);

  return {
    categories, loaded,
    addCategory, updateCategory, deleteCategory, getCategoryById,
    tagLibrary, addTagToLibrary, removeTagFromLibrary,
  };
}
