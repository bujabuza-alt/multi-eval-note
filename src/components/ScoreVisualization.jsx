'use client';

/**
 * Radar chart rendered as pure SVG — no external dependencies.
 */
function RadarChart({ items, scores, size = 180, color = '#6366f1' }) {
  const n = items.length;
  if (n < 3) return null;

  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.33;
  const labelRadius = r + size * 0.13;

  const angle = (i) => (i * 2 * Math.PI) / n - Math.PI / 2;
  const pt = (i, radius) => [
    cx + radius * Math.cos(angle(i)),
    cy + radius * Math.sin(angle(i)),
  ];

  const gridLevels = [0.2, 0.4, 0.6, 0.8, 1.0];

  const gridPolygonPoints = (level) =>
    items.map((_, i) => pt(i, r * level).join(',')).join(' ');

  const dataPolygonPoints = items
    .map((item, i) => {
      const score = Math.min(10, Math.max(0, scores?.[item] ?? 0));
      return pt(i, r * (score / 10)).join(',');
    })
    .join(' ');

  // Derive semi-transparent fill from hex color
  const hexToRgba = (hex, alpha) => {
    const h = hex.replace('#', '');
    const [r2, g, b] = [0, 2, 4].map((o) => parseInt(h.slice(o, o + 2), 16));
    return `rgba(${r2},${g},${b},${alpha})`;
  };

  const fontSize = Math.max(9, Math.round(size * 0.072));

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-label="레이더 차트"
    >
      {/* Grid polygons */}
      {gridLevels.map((level) => (
        <polygon
          key={level}
          points={gridPolygonPoints(level)}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth="1"
        />
      ))}

      {/* Axis lines */}
      {items.map((_, i) => {
        const [x, y] = pt(i, r);
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={x}
            y2={y}
            stroke="#e2e8f0"
            strokeWidth="1"
          />
        );
      })}

      {/* Data area */}
      <polygon
        points={dataPolygonPoints}
        fill={hexToRgba(color, 0.22)}
        stroke={color}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />

      {/* Data point dots */}
      {items.map((item, i) => {
        const score = Math.min(10, Math.max(0, scores?.[item] ?? 0));
        const [x, y] = pt(i, r * (score / 10));
        return (
          <circle key={i} cx={x} cy={y} r={Math.max(2.5, size * 0.018)} fill={color} />
        );
      })}

      {/* Labels */}
      {items.map((item, i) => {
        const [x, y] = pt(i, labelRadius);
        return (
          <text
            key={i}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={fontSize}
            fill="#64748b"
            fontFamily="inherit"
          >
            {item}
          </text>
        );
      })}
    </svg>
  );
}

/**
 * Horizontal bars chart.
 */
function HorizontalBars({ items, scores, color = '#6366f1', compact = false }) {
  return (
    <div className={`flex flex-col ${compact ? 'gap-1' : 'gap-2'}`}>
      {items.map((item) => {
        const score = Math.min(10, Math.max(0, scores?.[item] ?? 0));
        const pct = (score / 10) * 100;
        return (
          <div key={item} className="flex items-center gap-2">
            <span
              className={`shrink-0 text-slate-500 text-right ${compact ? 'text-[10px] w-10' : 'text-xs w-12'}`}
            >
              {item}
            </span>
            <div className="flex-1 bg-slate-100 rounded-full overflow-hidden" style={{ height: compact ? 6 : 8 }}>
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: `${pct}%`, backgroundColor: color }}
              />
            </div>
            <span className={`shrink-0 font-semibold text-slate-700 text-right ${compact ? 'text-[10px] w-4' : 'text-xs w-5'}`}>
              {score}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Public component: renders radar or bars chart plus the average score badge.
 *
 * Props:
 *  - items      string[]   evaluation item names
 *  - scores     Record<string, number>  0-10 per item
 *  - vizType    'radar' | 'bars'
 *  - color      hex string  (optional, category chart color)
 *  - size       number      radar chart pixel size (default 180)
 *  - compact    boolean     use smaller rendering for card view
 *  - showAvg    boolean     show average badge (default true)
 */
export function ScoreVisualization({
  items = [],
  scores = {},
  vizType = 'radar',
  color = '#6366f1',
  size = 180,
  compact = false,
  showAvg = true,
}) {
  if (!items.length) return null;

  const values = items.map((item) => scores?.[item] ?? 0);
  const avg = values.length
    ? (values.reduce((s, v) => s + v, 0) / values.length).toFixed(1)
    : '0.0';

  return (
    <div className="flex flex-col items-center gap-2">
      {vizType === 'radar' && items.length >= 3 ? (
        <RadarChart items={items} scores={scores} size={size} color={color} />
      ) : (
        <div className={`w-full ${compact ? 'px-1' : 'px-2'}`}>
          <HorizontalBars items={items} scores={scores} color={color} compact={compact} />
        </div>
      )}

      {showAvg && (
        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
          평균: {avg} / 10
        </span>
      )}
    </div>
  );
}
