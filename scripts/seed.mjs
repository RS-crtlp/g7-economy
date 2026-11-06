// Seeds public.observations with G7 inflation and unemployment from the World Bank API.
// Usage: npm run seed   (reads .env.local; needs SUPABASE_SECRET_KEY, server-side only)
import { createClient } from "@supabase/supabase-js";

const COUNTRIES = ["CAN", "FRA", "DEU", "ITA", "JPN", "GBR", "USA"];
const INDICATORS = {
  "FP.CPI.TOTL.ZG": "inflation",     // Inflation, consumer prices (annual %)
  "SL.UEM.TOTL.ZS": "unemployment",  // Unemployment, total (% of labor force, modeled ILO)
};
const FROM_YEAR = 2010;
const TO_YEAR = new Date().getFullYear();

const { NEXT_PUBLIC_SUPABASE_URL: url, SUPABASE_SECRET_KEY: secret } = process.env;
if (!url || !secret) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY. Run with: node --env-file=.env.local scripts/seed.mjs");
  process.exit(1);
}
const supabase = createClient(url, secret, { auth: { persistSession: false } });

async function fetchIndicator(code) {
  const endpoint =
    `https://api.worldbank.org/v2/country/${COUNTRIES.join(";")}/indicator/${code}` +
    `?format=json&date=${FROM_YEAR}:${TO_YEAR}&per_page=1000`;
  const res = await fetch(endpoint);
  if (!res.ok) throw new Error(`World Bank API ${res.status} for ${code}`);
  const body = await res.json();
  if (!Array.isArray(body) || !Array.isArray(body[1])) {
    throw new Error(`Unexpected response for ${code}: ${JSON.stringify(body).slice(0, 200)}`);
  }
  const [meta, data] = body;
  if (meta.pages > 1) throw new Error(`${code}: more than one page of results; raise per_page`);
  return data
    .filter((d) => d.value !== null) // skip years not yet published
    .map((d) => ({
      country: d.country.value,
      indicator: INDICATORS[code],
      year: Number(d.date),
      value: d.value,
    }));
}

const rows = (await Promise.all(Object.keys(INDICATORS).map(fetchIndicator))).flat();
console.log(`Fetched ${rows.length} observations from the World Bank.`);

// Upsert so the script can be re-run safely.
const { error } = await supabase
  .from("observations")
  .upsert(rows, { onConflict: "country,indicator,year" });
if (error) throw new Error(`Upsert failed: ${error.message}`);

// Row count per country, read back from the database.
const counts = {};
for (const country of [...new Set(rows.map((r) => r.country))].sort()) {
  const { count, error: e } = await supabase
    .from("observations")
    .select("*", { count: "exact", head: true })
    .eq("country", country);
  if (e) throw new Error(`Count failed for ${country}: ${e.message}`);
  counts[country] = count;
}
console.table(counts);
