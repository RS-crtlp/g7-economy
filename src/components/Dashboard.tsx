"use client";

import { useState } from "react";
import { COUNTRIES, INDICATORS, type CountryName } from "@/lib/countries";
import type { Observation } from "@/lib/supabase";
import { LineChart, type Series } from "./LineChart";

type IndicatorKey = keyof typeof INDICATORS;

function buildSeries(rows: Observation[], indicator: IndicatorKey): Series[] {
  return COUNTRIES.map(({ name, color }) => ({
    name,
    color,
    points: rows
      .filter((r) => r.country === name && r.indicator === indicator && r.value !== null)
      .map((r) => ({ x: r.year, y: r.value as number }))
      .sort((a, b) => a.x - b.x),
  }));
}

export function Dashboard({ rows }: { rows: Observation[] }) {
  const [hovered, setHovered] = useState<CountryName | null>(null);
  const [pinned, setPinned] = useState<CountryName | null>(null);
  const [year, setYear] = useState<number | null>(null); // shared crosshair
  const focus = hovered ?? pinned;

  const years = rows.map((r) => r.year);
  const xDomain: [number, number] = [Math.min(...years), Math.max(...years)];

  return (
    <div className="mt-8 flex flex-col gap-6">
      {/* Legend doubles as the highlight filter: one row, above the charts it scopes. */}
      <div className="flex flex-wrap items-center gap-x-1 gap-y-1" role="group" aria-label="Highlight a country">
        {COUNTRIES.map(({ name, color }) => {
          const active = pinned === name;
          const dim = focus !== null && focus !== name;
          return (
            <button
              key={name}
              type="button"
              aria-pressed={active}
              onClick={() => setPinned(active ? null : name)}
              onPointerEnter={() => setHovered(name)}
              onPointerLeave={() => setHovered(null)}
              onFocus={() => setHovered(name)}
              onBlur={() => setHovered(null)}
              className={`flex items-center gap-2 rounded-md px-2 py-1 text-sm transition-opacity hover:bg-black/5 dark:hover:bg-white/5 ${
                active ? "bg-black/5 font-medium dark:bg-white/10" : ""
              } ${dim ? "opacity-40" : ""}`}
            >
              <span aria-hidden className="inline-block h-0.5 w-4 rounded-full" style={{ background: color }} />
              {name}
            </button>
          );
        })}
        {pinned && (
          <button
            type="button"
            onClick={() => setPinned(null)}
            className="ml-1 rounded-md px-2 py-1 text-sm text-secondary underline-offset-2 hover:underline"
          >
            Show all
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {(Object.keys(INDICATORS) as IndicatorKey[]).map((key) => (
          <LineChart
            key={key}
            title={INDICATORS[key].title}
            subtitle={INDICATORS[key].subtitle}
            series={buildSeries(rows, key)}
            xDomain={xDomain}
            focus={focus}
            year={year}
            onYearChange={setYear}
          />
        ))}
      </div>
    </div>
  );
}
