import { createClient } from "@supabase/supabase-js";

// Public (read-only) client. Safe for the browser: uses the publishable/anon key.
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
);

export type Observation = {
  id: number;
  country: string;
  indicator: string;
  year: number;
  value: number | null;
};
