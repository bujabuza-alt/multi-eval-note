'use client';
import { useState } from 'react';
import { Star } from 'lucide-react';

export function StarRating({ value = 0, onChange, size = 'md', readonly = false }) {
  const [hovered, setHovered] = useState(0);

  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  const starSize = sizes[size] || sizes.md;

  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= (hovered || value);
        return (
          <button
            key={star}
            type="button"
            disabled={readonly}
            onClick={() => !readonly && onChange?.(star)}
            onMouseEnter={() => !readonly && setHovered(star)}
            onMouseLeave={() => !readonly && setHovered(0)}
            className={`transition-transform ${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'}`}
          >
            <Star
              className={`${starSize} transition-colors ${
                filled ? 'fill-amber-400 text-amber-400' : 'fill-transparent text-slate-300'
              }`}
            />
          </button>
        );
      })}
    </div>
  );
}
