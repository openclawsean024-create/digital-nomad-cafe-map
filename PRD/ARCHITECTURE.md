# Digital Nomad Cafe Map v3 — Architecture

## Runtime
- Next.js 16 App Router in `src/app/`
- React 19 client explorer with strict TypeScript
- Leaflet + OpenStreetMap for map visualization
- Vitest domain suite for filtering, scoring, access, reviews, contributions, reminders, and pilot seed invariants

## Data flow
1. `src/data/cafes.ts` provides transparent community seed data (48 Taiwan pilot entries plus global discovery samples).
2. `src/domain/cafes.ts` is the tested domain layer: weighted score, filtering, validation, entitlement, review aggregation, verification updates, reminder limits, and admin stats.
3. `src/lib/storage.ts` persists user contributions, reviews, demo entitlement, and reminders locally when Supabase credentials are absent.
4. `supabase/schema.sql` and migrations remain the production backend contract for authenticated shared persistence.

## Degradation
- No Supabase credentials: seed reads and local user contributions remain functional.
- No Stripe credentials: UI explicitly labels the 30-day entitlement as a demo and never charges.
- Map tiles unavailable: list view remains fully usable.

## Deployment
- npm only; Node >=20 and npm >=10.
- `npx next build` is the production gate.
- Canonical Vercel project name: `digital-nomad-cafe-map`.
