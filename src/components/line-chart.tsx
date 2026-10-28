"use client";

import { useEffect, useRef, useState } from "react";

export type LineSeries = {
  id: number;
  name: string;
  color: string;
  /** One value per x position; null where the series has no value yet. */
  values: (number | null)[];
};

type Props = {
  series: LineSeries[];
  /** Label for each x position, shown in the tooltip header. */
  xLabels: string[];
  yMin?: number;
  yMax?: number;
  /** Draw a horizontal reference line (e.g. the points needed to win). */
  target?: { value: number; label: string };
  step?: boolean;
  /** Decimal places for values in the axis and tooltip. */
  decimals?: number;
  height?: number;
};

const PAD = { top: 12, right: 16, bottom: 28, left: 36 };

function niceTicks(min: number, max: number, count = 5, integers = false) {
  const span = max - min || 1;
  const raw = span / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step =
    [1, 2, 2.5, 5, 10]
      .map((m) => m * mag)
      .find((s) => s >= raw && (!integers || Number.isInteger(s))) ?? Math.max(1, Math.ceil(raw));
  const ticks = [];
  for (let v = Math.ceil(min / step) * step; v <= max + 1e-9; v += step) ticks.push(Number(v.toFixed(6)));
  return ticks;
}

export function LineChart({ series, xLabels, yMin, yMax, target, step, decimals = 0, height = 280 }: Props) {
  const format = (v: number) => v.toFixed(decimals);
  const ref = useRef<HTMLDivElement>(null);
  // Measured from the container; 0 until the first layout so the chart never forces its parent wider.
  const [w, setWidth] = useState(0);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const n = xLabels.length;
  const all = series.flatMap((s) => s.values.filter((v): v is number => v !== null));
  if (target) all.push(target.value);
  const lo = yMin ?? Math.floor(Math.min(...all));
  const hi = yMax ?? Math.ceil(Math.max(...all));
  const ticks = niceTicks(lo, hi, 5, decimals === 0);

  const innerW = Math.max(w - PAD.left - PAD.right, 10);
  const innerH = height - PAD.top - PAD.bottom;
  const x = (i: number) => PAD.left + (n <= 1 ? innerW / 2 : (i / (n - 1)) * innerW);
  const y = (v: number) => PAD.top + innerH - ((v - lo) / (hi - lo || 1)) * innerH;

  const path = (values: (number | null)[]) => {
    let d = "";
    let prev: number | null = null;
    values.forEach((v, i) => {
      if (v === null) {
        prev = null;
        return;
      }
      if (prev === null) d += `M${x(i)},${y(v)}`;
      else if (step) d += `H${x(i)}V${y(v)}`;
      else d += `L${x(i)},${y(v)}`;
      prev = v;
    });
    return d;
  };

  const onMove = (e: React.PointerEvent<SVGRectElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const i = n <= 1 ? 0 : Math.round((px / rect.width) * (n - 1));
    setHover(Math.max(0, Math.min(n - 1, i)));
  };

  const hovered =
    hover === null
      ? []
      : series
          .map((s) => ({ s, v: s.values[hover] }))
          .filter((d): d is { s: LineSeries; v: number } => d.v !== null && d.v !== undefined)
          .sort((a, b) => b.v - a.v);
  const xTickEvery = Math.max(1, Math.ceil(n / Math.max(2, Math.floor(innerW / 60))));

  return (
    <div>
      {series.length > 1 && (
        <ul className="mb-4 flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
          {series.map((s) => (
            <li key={s.id} className="flex items-center gap-1.5">
              <span className="h-0.5 w-3 rounded-full" style={{ background: s.color }} aria-hidden />
              {s.name}
            </li>
          ))}
        </ul>
      )}
      <div ref={ref} className="relative min-w-0" style={{ height }}>
        <svg width={w} height={height} className="block overflow-visible" role="img" aria-label="Line chart">
          {ticks.map((t) => (
            <g key={t}>
              <line x1={PAD.left} x2={w - PAD.right} y1={y(t)} y2={y(t)} stroke="var(--border)" strokeWidth={1} />
              <text x={PAD.left - 8} y={y(t)} dy="0.32em" textAnchor="end" className="fill-muted-foreground font-mono text-[10px]">
                {format(t)}
              </text>
            </g>
          ))}
          {xLabels.map((label, i) =>
            i % xTickEvery === 0 || i === n - 1 ? (
              <text key={i} x={x(i)} y={height - 8} textAnchor="middle" className="fill-muted-foreground font-mono text-[10px]">
                {label}
              </text>
            ) : null,
          )}
          {target && (
            <g>
              <line
                x1={PAD.left}
                x2={w - PAD.right}
                y1={y(target.value)}
                y2={y(target.value)}
                stroke="var(--signal)"
                strokeDasharray="4 4"
                strokeWidth={1}
              />
              <text x={w - PAD.right} y={y(target.value) - 6} textAnchor="end" className="fill-muted-foreground font-mono text-[10px]">
                {target.label}
              </text>
            </g>
          )}
          {series.map((s) => (
            <path
              key={s.id}
              d={path(s.values)}
              fill="none"
              stroke={s.color}
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
              opacity={hover === null ? 1 : 0.85}
            />
          ))}
          {hover !== null && (
            <g>
              <line x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={PAD.top + innerH} stroke="var(--ring)" strokeWidth={1} />
              {hovered.map(({ s, v }) => (
                <circle key={s.id} cx={x(hover)} cy={y(v)} r={4.5} fill={s.color} stroke="var(--card)" strokeWidth={2} />
              ))}
            </g>
          )}
          <rect
            x={PAD.left}
            y={PAD.top}
            width={innerW}
            height={innerH}
            fill="transparent"
            onPointerMove={onMove}
            onPointerLeave={() => setHover(null)}
          />
        </svg>
        {hover !== null && hovered.length > 0 && (
          <div
            className="pointer-events-none absolute top-2 z-10 min-w-36 rounded-lg border border-border bg-background px-3 py-2 text-sm shadow-lg"
            style={
              x(hover) > w / 2
                ? { right: w - x(hover) + 12 }
                : { left: x(hover) + 12 }
            }
          >
            <div className="eyebrow mb-1.5">{xLabels[hover]}</div>
            {hovered.map(({ s, v }) => (
              <div key={s.id} className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full" style={{ background: s.color }} aria-hidden />
                  {s.name}
                </span>
                <span className="tabular font-medium">{format(v)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
