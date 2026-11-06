import { Suspense } from "react";
import { connection } from "next/server";
import { supabase, type Observation } from "@/lib/supabase";
import { INDICATORS } from "@/lib/countries";
import { Dashboard } from "@/components/Dashboard";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">G7 Economy</h1>
      <p className="mt-2 text-secondary">
        Inflation and unemployment in Canada, France, Germany, Italy, Japan, the UK and the US since 2010.
      </p>
      <Suspense fallback={<p className="mt-8 text-muted">Loading…</p>}>
        <Observations />
      </Suspense>
      <p className="mt-10 text-xs text-muted">
        Source: World Bank — FP.CPI.TOTL.ZG and SL.UEM.TOTL.ZS (modelled ILO estimate).
      </p>
    </main>
  );
}

async function Observations() {
  await connection(); // always read fresh data at request time
  const { data, error } = await supabase
    .from("observations")
    .select("*")
    .order("country")
    .order("indicator")
    .order("year", { ascending: false })
    .limit(1000);

  if (error) console.error("[observations] Supabase error:", error.message, "|", error.details, "|", error.hint);
  if (error) return <p className="mt-8 text-red-600">Could not load data: {error.message}</p>;
  const rows = (data ?? []) as Observation[];
  if (rows.length === 0) return <p className="mt-8 text-muted">No observations yet.</p>;

  return (
    <>
      <Dashboard rows={rows} />

      <details className="mt-8 rounded-xl border border-border bg-surface p-4">
        <summary className="cursor-pointer text-sm font-medium">Show data table ({rows.length} rows)</summary>
        <div className="mt-4 max-h-[32rem] overflow-auto">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 border-b border-border bg-surface">
              <tr>
                <th className="py-2 pr-4">Country</th>
                <th className="py-2 pr-4">Indicator</th>
                <th className="py-2 pr-4">Year</th>
                <th className="py-2 text-right">Value</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-border">
                  <td className="py-1.5 pr-4">{r.country}</td>
                  <td className="py-1.5 pr-4 text-secondary">
                    {INDICATORS[r.indicator as keyof typeof INDICATORS]?.title ?? r.indicator}
                  </td>
                  <td className="py-1.5 pr-4 tabular-nums">{r.year}</td>
                  <td className="py-1.5 text-right tabular-nums">{r.value === null ? "—" : `${r.value.toFixed(1)}%`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </>
  );
}
