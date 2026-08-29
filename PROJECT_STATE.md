# Project State

## Ground truth
- Sprint workspace: `/Users/sean/Program/digital-nomad-cafe-map` (the prior canonical `/tmp/digital-nomad-cafe-map-dev` referenced in earlier docs is no longer present in this environment; git history is intact)
- GitHub: `https://github.com/openclawsean024-create/digital-nomad-cafe-map`
- Branch: `main` @ `bb757dfd` (HEAD = 2026-08-08 14:37 +0800, by `Hermes Agent <hermes@minimax.ai>`)
- Vercel canonical project: `digital-nomad-cafe-map`
- Production URL: https://digital-nomad-cafe-map.vercel.app/  (HTTP 200, Vercel edge cache HIT)
- GitHub Pages mirror: https://openclawsean024-create.github.io/digital-nomad-cafe-map/  (HTTP 200, byte-identical to Vercel)
- SPEC: `PRD/SPEC.md` v3.0

## Current stage
- Stage 1 environment: complete
- Stage 2 TDD/P0 implementation: complete locally
- Stage 3 tests/typecheck/build: complete locally; **done** (re-verified 2026-08-29 — 63/63 tests pass, strict TypeScript pass, `next build` exit 0, 1 static route + icon.svg)
- Stage 4 production deployment: **done** (2026-08-29 verified — both Vercel and GitHub Pages serve the production build, byte-identical 139,121 bytes, all 5 P0 features render)

## Functional scope
- Cafe city database (4,357 Taiwan cafes from OpenStreetMap, full 22-county coverage)
- 5-dim scoring (WiFi / 安靜 / 插座 / 價格 / 友善)
- Leaflet map + ranked list + filters
- Free-three access gate and explicit demo entitlement fallback
- User reviews, on-site verification, cafe contribution
- One-to-three city reminders and pilot admin metrics

## Known production integration boundary
Private Supabase, Stripe, Resend, and speedtest credentials were not supplied. Their real external side effects are therefore not claimed. The UI degrades to local persistence and explicit demo behavior; backend schema remains in `supabase/`. All current cafe-rating values render as `—` (unverified) because no real verification data exists yet — this is expected for the demo entitlement path and is the boundary called out in `STATUS.md`.

## Stage 4 verification evidence (2026-08-29)
- `npm run test` → 63/63 passed in 956 ms
- `npm run typecheck` → exit 0
- `npm run build` → `next build` exit 0, 1 static route (`/`), `/_not-found`, `/icon.svg`
- `curl -sI https://digital-nomad-cafe-map.vercel.app/` → HTTP/2 200, server: Vercel, content-type: text/html
- `curl -sI https://openclawsean024-create.github.io/digital-nomad-cafe-map/` → HTTP/2 200, server: GitHub.com
- `curl -sL https://digital-nomad-cafe-map.vercel.app/ | wc -c` = 139,121 (matches GitHub Pages byte-identical)
- HTML inspection confirms: 5-dim metric labels, city tags for 10+ cities, mobile-tab nav (篩選/地圖/清單), Leaflet script chunks, free-200-of-4357 gate footer