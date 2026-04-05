'use client';
import { Pencil, Trash2 } from 'lucide-react';
import { StarRating } from './StarRating';
import { getCategoryById } from '@/lib/categories';

function formatDate(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${y}년 ${Number(m)}월 ${Number(d)}일`;
}

export function NoteCard({ note, onEdit, onDelete }) {
  const cat = getCategoryById(note.category);

  return (
    <div className="group bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200 p-5 flex flex-col gap-3 border border-slate-100">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cat.bg} ${cat.text} shrink-0`}
          >
            <span>{cat.emoji}</span>
            {cat.label}
          </span>
        </div>
        {/* Actions */}
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button
            onClick={() => onEdit(note)}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
            aria-label="수정"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(note.id)}
            className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition-colors"
            aria-label="삭제"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Title */}
      <h3 className="text-lg font-semibold text-slate-800 leading-snug line-clamp-2">
        {note.title}
      </h3>

      {/* Rating */}
      <StarRating value={note.rating} readonly size="sm" />

      {/* Memo */}
      {note.memo && (
        <p className="text-sm text-slate-500 line-clamp-3 leading-relaxed">{note.memo}</p>
      )}

      {/* Tags */}
      {note.tags && note.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {note.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-full"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Date */}
      {note.date && (
        <p className="text-xs text-slate-400 mt-auto pt-1 border-t border-slate-50">
          {formatDate(note.date)}
        </p>
      )}
    </div>
  );
}
