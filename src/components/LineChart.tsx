"use client";

import { useEffect, useRef, useState } from "react";

export type Series = { name: string; color: string; points: { x: number; y: number }[] };

type Props = {
  title: string;
  subtitle: string;
  series: Series[];
  xDomain: [number, number];
  focus: string | null;
  year: number | null;
  onYearChange: (year: number | null) => void;
};

const HEIGHT = 280;
const M = { top: 12, right: 16, bottom: 28, left: 36 };

function niceStep(range: number, count: number) {
  const raw = range / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const n = raw / mag;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * mag;
}

function yTicks(min: number, max: number) {
  const lo = Math.min(0, min);
  const step = niceStep(max - lo || 1, 5);
  const start = Math.floor(lo / step) * step;
  const end = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let v = start; v <= end + step / 2; v += step) ticks.push(Math.round(v * 100) / 100);
  return ticks;
}

const fmt = (v: number) => `${v.toFixed(1)}%`;

export function LineChart({ title, subtitle, series, xDomain, focus, year, onYearChange }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(560);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(Math.max(240, Math.floor(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const all = series.flatMap((s) => s.points.map((p) => p.y));
  const ticks = yTicks(Math.min(...all), Math.max(...all));
  const [y0, y1] = [ticks[0], ticks[ticks.length - 1]];
  const [x0, x1] = xDomain;
  const plotW = width - M.left - M.right;
  const plotH = HEIGHT - M.top - M.bottom;
  const sx = (x: number) => M.left + ((x - x0) / (x1 - x0)) * plotW;
  const sy = (y: number) => M.top + (1 - (y - y0) / (y1 - y0)) * plotH;

  const xStep = plotW < 360 ? 5 : 2;
  const xTicks: number[] = [];
  // Anchor ticks on the latest year so it is always labelled and never collides.
  for (let x = x1; x >= x0; x -= xStep) xTicks.push(x);

  // Draw the focused country last so it sits on top.
  const ordered = focus ? [...series.filter((s) => s.name !== focus), ...series.filter((s) => s.name === focus)] : series;

  const pickYear = (clientX: number, rect: DOMRect) => {
    const px = ((clientX - rect.left) / rect.width) * width;
    const x = Math.round(x0 + ((px - M.left) / plotW) * (x1 - x0));
    onYearChange(Math.min(x1, Math.max(x0, x)));
  };

  const readout =
    year === null
      ? []
      : series
          .map((s) => ({ ...s, v: s.points.find((p) => p.x === year)?.y }))
          .sort((a, b) => (b.v ?? -Infinity) - (a.v ?? -Infinity));
  const tipLeft = year === null ? 0 : sx(year);
  const tipOnLeft = tipLeft > width * 0.6;

  return (
    <section className="min-w-0 rounded-xl border border-border bg-surface p-4">
      <h2 className="text-base font-semibold">{title}</h2>
      <p className="text-sm text-secondary">{subtitle}</p>

      <div ref={wrapRef} className="relative mt-3">
        <svg
          width={width}
          height={HEIGHT}
          role="img"
          aria-label={`${title} by country, ${x0} to ${x1}. Use arrow keys to read values by year.`}
          tabIndex={0}
          className="block touch-none outline-none focus-visible:ring-2 focus-visible:ring-[var(--series-1)] rounded"
          onPointerMove={(e) => pickYear(e.clientX, e.currentTarget.getBoundingClientRect())}
          onPointerDown={(e) => pickYear(e.clientX, e.currentTarget.getBoundingClientRect())}
          onPointerLeave={() => onYearChange(null)}
          onFocus={() => year === null && onYearChange(x1)}
          onBlur={() => onYearChange(null)}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
              e.preventDefault();
              const d = e.key === "ArrowLeft" ? -1 : 1;
              onYearChange(Math.min(x1, Math.max(x0, (year ?? x1) + d)));
            } else if (e.key === "Escape") onYearChange(null);
          }}
        >
          {/* Recessive grid; zero gets the stronger baseline. */}
          {ticks.map((t) => (
            <g key={t}>
              <line
                x1={M.left}
                x2={width - M.right}
                y1={sy(t)}
                y2={sy(t)}
                stroke={t === 0 ? "var(--baseline)" : "var(--gridline)"}
                strokeWidth={1}
                shapeRendering="crispEdges"
              />
              <text x={M.left - 8} y={sy(t)} dy="0.32em" textAnchor="end" fontSize={12} fill="var(--text-muted)" className="tabular-nums">
                {t}
              </text>
            </g>
          ))}
          {xTicks.map((x) => (
            <text key={x} x={sx(x)} y={HEIGHT - 8} textAnchor="middle" fontSize={12} fill="var(--text-muted)" className="tabular-nums">
              {x}
            </text>
          ))}

          {year !== null && (
            <line x1={sx(year)} x2={sx(year)} y1={M.top} y2={M.top + plotH} stroke="var(--text-muted)" strokeWidth={1} shapeRendering="crispEdges" />
          )}

          {ordered.map((s) => (
            <path
              key={s.name}
              d={s.points.map((p, i) => `${i ? "L" : "M"}${sx(p.x).toFixed(1)},${sy(p.y).toFixed(1)}`).join("")}
              fill="none"
              stroke={s.color}
              strokeWidth={focus === s.name ? 2.5 : 2}
              strokeLinejoin="round"
              strokeLinecap="round"
              opacity={focus && focus !== s.name ? 0.15 : 1}
              style={{ transition: "opacity 150ms" }}
            />
          ))}

          {year !== null &&
            ordered.map((s) => {
              const p = s.points.find((q) => q.x === year);
              if (!p || (focus && focus !== s.name)) return null;
              return <circle key={s.name} cx={sx(p.x)} cy={sy(p.y)} r={4} fill={s.color} stroke="var(--surface-1)" strokeWidth={2} />;
            })}
        </svg>

        {year !== null && (
          <div
            role="status"
            className="pointer-events-none absolute top-2 z-10 min-w-44 rounded-lg border border-border bg-surface px-3 py-2 text-sm shadow-lg"
            style={tipOnLeft ? { right: width - tipLeft + 12 } : { left: tipLeft + 12 }}
          >
            <div className="mb-1 text-xs font-medium text-secondary">{year}</div>
            {readout.map((r) => (
              <div key={r.name} className={`flex items-center gap-2 py-0.5 ${focus && focus !== r.name ? "opacity-40" : ""}`}>
                <span aria-hidden className="inline-block h-0.5 w-3 shrink-0 rounded-full" style={{ background: r.color }} />
                <span className="w-12 font-semibold tabular-nums">{r.v === undefined ? "—" : fmt(r.v)}</span>
                <span className="text-secondary">{r.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
