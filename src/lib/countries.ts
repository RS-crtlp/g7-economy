// Fixed colour per country: colour follows the entity, never its rank or the filter.
export const COUNTRIES = [
  { name: "Canada", color: "var(--series-1)" },
  { name: "France", color: "var(--series-2)" },
  { name: "Germany", color: "var(--series-3)" },
  { name: "Italy", color: "var(--series-4)" },
  { name: "Japan", color: "var(--series-5)" },
  { name: "United Kingdom", color: "var(--series-6)" },
  { name: "United States", color: "var(--series-7)" },
] as const;

export type CountryName = (typeof COUNTRIES)[number]["name"];

export const INDICATORS = {
  inflation: { title: "Inflation", subtitle: "Consumer prices, annual %" },
  unemployment: { title: "Unemployment", subtitle: "% of labour force" },
} as const;
