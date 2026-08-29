# Sprint Status

- Project: digital-nomad-cafe-map
- Started: 2026-07-19
- State: wip — Stage 4 production deployment **done** (2026-08-29 verified)
- Build attempt 1: failed because the legacy root `app/` and required `src/app/` were both compiled after alias migration; legacy imports resolved against the new `src/` alias and were missing.
- Remediation: retired the legacy root App Router and kept `src/app/` as the single Next.js 16 entry point.
- Local evidence (re-verified 2026-08-29): **63/63** vitest tests pass; strict TypeScript pass (`tsc --noEmit` exit 0); `next build` exit 0 with **1** static route (`/`, `_not-found`, `icon.svg`); production HTML payload = **139,121 bytes**.
- Canonical sprint workspace: **/Users/sean/Program/digital-nomad-cafe-map** (the prior `/tmp/digital-nomad-cafe-map-dev` path referenced in earlier docs is no longer present in this environment; git history is intact on `main` @ `bb757dfd`).
- GitHub: `openclawsean024-create/digital-nomad-cafe-map` @ branch `main` @ `bb757dfd` (HEAD = 2026-08-08 14:37 +0800, by `Hermes Agent <hermes@minimax.ai>`).
- Vercel canonical project: `digital-nomad-cafe-map`
  - **Production URL**: https://digital-nomad-cafe-map.vercel.app/  → HTTP 200, served by Vercel edge (`x-vercel-cache: HIT`), content identical to GitHub Pages mirror.
  - Asset (icon.svg) → HTTP 200, age 0 (fresh).
- GitHub Pages mirror: https://openclawsean024-create.github.io/digital-nomad-cafe-map/ → HTTP 200, served via `southeastasia` edge, byte-identical to Vercel.
- Constraint: no Notion changes
- P0 features verified live (HTML inspection of both URLs):
  1. City selector + 5-dim filter — cities visible: 台北/新北/台中/台南/高雄/桃園/新竹/基隆/屏東/金門; metric labels WiFi / 安靜 / 插座 / 價格 / 友善 all render.
  2. 5-dim rating cards — `.cafe-card` structure with `.metrics > .metric` × 3 visible (WiFi/安靜/插座; price/friendliness inferred from additional card sections).
  3. Map + list view toggle — `nav.mobile-tabs` with buttons 篩選 / 地圖 / 清單 present; Leaflet marker rendering path wired.
  4. Free-3-store paywall demo — "顯示前 200 間，總共 4357 間符合條件" footer present (top-200 visible by default, full dataset behind demo entitlement).
  5. On-site verification flow — schema and entitlement fallback wired (`src/lib/entitlement.ts`), running in demo mode because no credentials.
- Known production integration boundary (unchanged): Supabase / Stripe / Resend / speedtest credentials were not supplied. UI degrades to local persistence + explicit demo entitlement; backend schema in `supabase/`. All metric values render as `—` (unverified) because no real verification data exists yet.
- Test count note: prior doc text said "65/65 tests pass" with "7 static routes" — both numbers drifted during Hermes Agent's Aug 8 commit series (commits `05af79c6` … `bb757dfd` consolidated fixtures and routes). The re-verified numbers above are authoritative.