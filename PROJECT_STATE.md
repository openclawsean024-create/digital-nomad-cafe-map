# Project State

## Ground truth
- Sprint workspace: `/tmp/digital-nomad-cafe-map-dev` (explicit user instruction)
- GitHub: `https://github.com/openclawsean024-create/digital-nomad-cafe-map`
- Branch: `main`
- Vercel canonical project: `digital-nomad-cafe-map`
- SPEC: `PRD/SPEC.md` v3.0

## Current stage
- Stage 1 environment: complete
- Stage 2 TDD/P0 implementation: complete locally
- Stage 3 tests/typecheck/build: complete locally; final rerun pending commit
- Stage 4 production deployment: pending

## Functional scope
- Cafe city database and 48 Taiwan pilot seed
- WiFi / quiet / outlet / price / friendliness scoring
- Leaflet map + ranked list + filters
- Free-three access gate and explicit demo entitlement fallback
- User reviews, on-site verification, cafe contribution
- One-to-three city reminders and pilot admin metrics

## Known production integration boundary
Private Supabase, Stripe, Resend, and speedtest credentials were not supplied. Their real external side effects are therefore not claimed. The UI degrades to local persistence and explicit demo behavior; backend schema remains in `supabase/`.
