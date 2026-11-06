# G7 Economy

Inflation and unemployment for the G7 (Canada, France, Germany, Italy, Japan, UK, US) since 2010.

**Live:** https://g7-economy-seven.vercel.app

- **Data:** World Bank API — `FP.CPI.TOTL.ZG` (inflation, annual %) and `SL.UEM.TOTL.ZS` (unemployment, % of labour force)
- **Database:** Supabase (Paris, `eu-west-3`), table `observations(country, indicator, year, value)` — public read, no public writes (RLS)
- **App:** Next.js 16, deployed on Vercel; every push to `main` deploys to production

## Run locally

Create `.env.local` with:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
SUPABASE_SECRET_KEY=...   # only needed for npm run seed
```

```bash
npm install
npm run dev      # http://localhost:3000
npm run seed     # (re)load World Bank data — safe to re-run
```

The local scripts run Node with `--use-system-ca` so HTTPS works behind antivirus HTTPS scanning (e.g. Avast).

## Schema

See [`supabase/migrations`](supabase/migrations).
