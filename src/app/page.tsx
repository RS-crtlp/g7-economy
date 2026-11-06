import { Suspense } from "react";
import { connection } from "next/server";
import { supabase, type Observation } from "@/lib/supabase";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-12 font-sans">
      <h1 className="text-3xl font-semibold tracking-tight">G7 Economy</h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        Economic indicators for Canada, France, Germany, Italy, Japan, the UK and the US.
      </p>
      <Suspense fallback={<p className="mt-8 text-zinc-500">Loading…</p>}>
        <ObservationsTable />
      </Suspense>
    </main>
  );
}

async function ObservationsTable() {
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
  if (rows.length === 0) return <p className="mt-8 text-zinc-500">No observations yet.</p>;

  return (
    <div className="mt-8 overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-zinc-300 dark:border-zinc-700">
          <tr>
            <th className="py-2 pr-4">Country</th>
            <th className="py-2 pr-4">Indicator</th>
            <th className="py-2 pr-4">Year</th>
            <th className="py-2 text-right">Value</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b border-zinc-100 dark:border-zinc-800">
              <td className="py-2 pr-4">{r.country}</td>
              <td className="py-2 pr-4">{r.indicator}</td>
              <td className="py-2 pr-4 tabular-nums">{r.year}</td>
              <td className="py-2 text-right tabular-nums">{r.value?.toLocaleString() ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
