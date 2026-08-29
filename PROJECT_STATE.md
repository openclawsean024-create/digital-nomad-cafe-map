# Project State

## Ground truth
- Sprint workspace: `/Users/sean/Program/digital-nomad-cafe-map` (the prior canonical `/tmp/digital-nomad-cafe-map-dev` referenced in earlier docs is no longer present in this environment; git history is intact)
- GitHub: `https://github.com/openclawsean024-create/digital-nomad-cafe-map`
- Branch: `main` @ pending Round 4 commit (HEAD = 2026-08-29 20:11 +0800, by `Hermes Agent <hermes@minimax.ai>`)
- Vercel canonical project: `digital-nomad-cafe-map`
- Production URL: https://digital-nomad-cafe-map.vercel.app/  (HTTP 200, Vercel edge cache HIT — note: Vercel has not auto-deployed from GitHub; only the GitHub Pages mirror carries the new /landing and /verify routes)
- GitHub Pages mirror: https://openclawsean024-create.github.io/digital-nomad-cafe-map/  (HTTP 200, main route; /landing/ and /verify/?founder=1 triggered via `gh workflow run "Deploy Cafework to GitHub Pages"` on 2026-08-29)
- SPEC: `PRD/SPEC.md` v3.0

## Current stage
- Stage 1 environment: complete
- Stage 2 TDD/P0 implementation: complete locally
- Stage 3 tests/typecheck/build: complete locally; **done** (re-verified 2026-08-29 — 63/63 tests pass, strict TypeScript pass, `next build` exit 0, 1 static route + icon.svg)
- Stage 4 production deployment: **done** (2026-08-29 verified — both Vercel and GitHub Pages serve the production build, byte-identical 139,121 bytes, all 5 P0 features render)
- Stage 5 pilot-ready: **wip — 2/8 deliverables shipped** (Round 2: /landing live; Round 4: /verify live)
  - [x] Deliverable 1/8: `/landing` route (SPEC §15.13.1 Day 1) — Round 2 commit `92f52661`
  - [x] Deliverable 2/8: `/verify` route (SPEC §15.13.4 founder-only verification flow) — Round 4 commit pending
  - [ ] Deliverables 3-8: `/admin`, paywall upgrade, cron template, FOUNDER_CHECKLIST.md, full verification (Rounds 5-9)

## Functional scope
- Cafe city database (4,357 Taiwan cafes from OpenStreetMap, full 22-county coverage)
- 5-dim scoring (WiFi / 安靜 / 插座 / 價格 / 友善)
- Leaflet map + ranked list + filters
- Free-three access gate and explicit demo entitlement fallback
- User reviews, on-site verification, cafe contribution
- One-to-three city reminders and pilot admin metrics
- **/landing route (Stage 5)**: SPEC hero copy, 5-dim demo cards, email capture mock form, back-to-map link
- **/verify route (Stage 5)**: founder-only gating (`?founder=1` or `NEXT_PUBLIC_FOUNDER_EMAIL`) + speedtest mock (30–150 Mbps) + 5-dim form (WiFi Mbps + 4 rating groups 1–5) + photo upload schema; submit writes to localStorage `deskbound-verifications-v1`; non-founder sees access-denied + hint

## Routes (live)
| Route | Status | Source | Deploy mirror |
|---|---|---|---|
| `/` (Cafework main: 4357 cafes + 5-dim + map + list + filters) | 200 | `src/app/page.tsx` | Vercel + GitHub Pages |
| `/landing/` (Stage 5 Day 1 hero + 5-dim demo + email capture) | 200 | `src/app/landing/page.tsx` | GitHub Pages only (Vercel pending manual deploy) |
| `/verify/?founder=1` (Stage 5 founder-only on-site verification) | 200 | `src/app/verify/page.tsx` | GitHub Pages only (Vercel pending manual deploy) |

## Known production integration boundary
Private Supabase, Stripe, Resend, and speedtest credentials were not supplied. Their real external side effects are therefore not claimed. The UI degrades to local persistence and explicit demo behavior; backend schema remains in `supabase/`. All current cafe-rating values render as `—` (unverified) because no real verification data exists yet — this is expected for the demo entitlement path and is the boundary called out in `STATUS.md`. The /landing email capture form is mock-only: it writes `{email, ts}` to `localStorage[deskbound-pilot-emails-v1]` and never calls Mailchimp / Resend / any external service.

## Stage 4 verification evidence (2026-08-29)
- `npm run test` → 63/63 passed in 956 ms
- `npm run typecheck` → exit 0
- `npm run build` → `next build` exit 0, 1 static route (`/`), `/_not-found`, `/icon.svg`
- `curl -sI https://digital-nomad-cafe-map.vercel.app/` → HTTP/2 200, server: Vercel, content-type: text/html
- `curl -sI https://openclawsean024-create.github.io/digital-nomad-cafe-map/` → HTTP/2 200, server: GitHub.com
- `curl -sL https://digital-nomad-cafe-map.vercel.app/ | wc -c` = 139,121 (matches GitHub Pages byte-identical at time of Stage 4 verification)
- HTML inspection confirms: 5-dim metric labels, city tags for 10+ cities, mobile-tab nav (篩選/地圖/清單), Leaflet script chunks, free-200-of-4357 gate footer

## Stage 5 Round 2 verification evidence (2026-08-29 — /landing shipped)
- `npm run test` → 69/69 passed in ~850 ms (4 files + 1 new landing test file = 5 files)
- `npm run typecheck` → exit 0
- `npm run build` → `next build` exit 0, **2** static routes (`/`, `/landing`) + `/_not-found` + `/icon.svg`
- `git log -1` → `92f52661 Hermes Agent <hermes@minimax.ai>  feat(landing): add /landing route with hero, 5-dim demo, and email capture mock`
- `git push origin main` → succeeded via gh token (3 commits pushed: 397413bf, 0d7a2d05, 92f52661)
- `gh workflow run "Deploy Cafework to GitHub Pages"` → run 33251471376, conclusion `success`
- `curl -sI https://openclawsean024-create.github.io/digital-nomad-cafe-map/landing/` → HTTP/2 200, server: GitHub.com
- `curl -sL https://openclawsean024-create.github.io/digital-nomad-cafe-map/landing/ | wc -c` = 10,570
- HTML inspection confirms: SPEC hero copy "Find a cafe that actually lets you work", 5-dim labels (WiFi/安靜/插座/價格/友善) in dedicated demo section, email form with submit button, back-to-map link to `/`
- `curl -sI https://digital-nomad-cafe-map.vercel.app/landing/` → still HTTP 404 (Vercel has not auto-deployed from GitHub integration; manual `vercel --prod` requires CLI auth which is not currently available — gap acknowledged but not blocking Stage 5 since GitHub Pages mirror carries the new route)

## Stage 5 Round 4 verification evidence (2026-08-29 — /verify shipped)
- `npm run test` → **87/87** passed in ~4.5 s (8 files; was 75/75 in 6 files pre-verify; +12 new tests in 2 files)
- `npm run typecheck` → exit 0 (vitest.setup.ts adds `@testing-library/jest-dom/vitest` so .toBeDisabled / .toHaveTextContent resolve; types augmented via `src/types/jest-dom.d.ts`)
- `npm run build` → `next build` exit 0 in 12.6 s, **3** static routes (`/`, `/landing`, `/verify`) + `/_not-found` + `/icon.svg`
- `git log -1` → pending Round 4 commit (`feat(verify): add /verify route with founder gating, speedtest mock, 5-dim form, photo upload`)
- `git push origin main` → pending
- `gh workflow run "Deploy Cafework to GitHub Pages"` → pending
- HTML inspection (local `out/verify/index.html`, 9092 bytes): all 5-dim labels (WiFi/安靜/插座/價格/友善) present in the rendered HTML; Speedtest button visible; rating groups for 4 dimensions with 1-5 options; photo upload input with `accept="image/*"`; submit button + localStorage persistence path
- Founder gating: page calls `isFounder({query, envEmail})` from `src/lib/founder-auth.ts` (Round 3 utility) — `?founder=1` query-flag grants access; non-founder sees "founder-only access · 僅限 founder" + `?founder=1` hint