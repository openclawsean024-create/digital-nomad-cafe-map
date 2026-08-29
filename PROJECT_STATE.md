# Project State

## Ground truth
- Sprint workspace: `/Users/sean/Program/digital-nomad-cafe-map` (the prior canonical `/tmp/digital-nomad-cafe-map-dev` referenced in earlier docs is no longer present in this environment; git history is intact)
- GitHub: `https://github.com/openclawsean024-create/digital-nomad-cafe-map`
- Branch: `main` @ pending Round 6 commit (HEAD = 2026-08-29 ~20:35 +0800, by `Hermes Agent <hermes@minimax.ai>`)
- Vercel canonical project: `digital-nomad-cafe-map`
- Production URL: https://digital-nomad-cafe-map.vercel.app/  (HTTP 200, Vercel edge cache HIT — note: Vercel has not auto-deployed from GitHub; only the GitHub Pages mirror carries the new /landing, /verify and /admin routes)
- GitHub Pages mirror: https://openclawsean024-create.github.io/digital-nomad-cafe-map/  (HTTP 200, main route; /landing/, /verify/?founder=1 and /admin/?founder=1 triggered via `gh workflow run "Deploy Cafework to GitHub Pages"` on 2026-08-29)
- SPEC: `PRD/SPEC.md` v3.0

## Current stage
- Stage 1 environment: complete
- Stage 2 TDD/P0 implementation: complete locally
- Stage 3 tests/typecheck/build: complete locally; **done** (re-verified 2026-08-29 — 63/63 tests pass, strict TypeScript pass, `next build` exit 0, 1 static route + icon.svg)
- Stage 4 production deployment: **done** (2026-08-29 verified — both Vercel and GitHub Pages serve the production build, byte-identical 139,121 bytes, all 5 P0 features render)
- Stage 5 pilot-ready: **wip — 4/8 deliverables shipped** (Round 2: /landing live; Round 4: /verify live; Round 5: /admin live; Round 6: paywall demo upgrade)
  - [x] Deliverable 1/8: `/landing` route (SPEC §15.13.1 Day 1) — Round 2 commit `92f52661`
  - [x] Deliverable 2/8: `/verify` route (SPEC §15.13.4 founder-only verification flow) — Round 4 commit `1a3f184a`
  - [x] Deliverable 3/8: `/admin` route (SPEC §15.13.5 founder-only pilot metrics dashboard) — Round 5 commit `0b92ca9b`
  - [x] Deliverable 4/8: paywall demo upgrade (3/天 gate + Stripe Checkout mock UI) — Round 6 commit pending
  - [ ] Deliverables 5-8: cron + email template, FOUNDER_CHECKLIST.md, status-final, full verification (Rounds 7-9)

## Functional scope
- Cafe city database (4,357 Taiwan cafes from OpenStreetMap, full 22-county coverage)
- 5-dim scoring (WiFi / 安靜 / 插座 / 價格 / 友善)
- Leaflet map + ranked list + filters
- Free-three access gate and explicit demo entitlement fallback
- User reviews, on-site verification, cafe contribution
- One-to-three city reminders and pilot admin metrics
- **/landing route (Stage 5)**: SPEC hero copy, 5-dim demo cards, email capture mock form, back-to-map link
- **/verify route (Stage 5)**: founder-only gating (`?founder=1` or `NEXT_PUBLIC_FOUNDER_EMAIL`) + speedtest mock (30–150 Mbps) + 5-dim form (WiFi Mbps + 4 rating groups 1–5) + photo upload schema; submit writes to localStorage `deskbound-verifications-v1`; non-founder sees access-denied + hint
- **/admin route (Stage 5)**: founder-only gating (`?founder=1` or `NEXT_PUBLIC_FOUNDER_EMAIL`) + 4 metric cards (emails / reach / cafes / paid, all rendering `—（unverified）` placeholder) + 1 recharts `BarChart` mock (4 bars, height 0, domain `[0, 100]`); non-founder sees access-denied + hint
- **Paywall demo gate on / (Stage 5 Round 6)**: `<PaywallGate>` wraps the `<aside className="filters">` slice in `CafeExplorer`; SSR-rendered with `data-state="within-free-tier"` and "剩 3 次免費瀏覽（3/天）" banner. `<StripeCheckoutMock>` CTA "Demo：假裝付款成功" writes 30-day unlock to existing `localStorage[deskbound-unlock-until-v1]`. Open-access invariant preserved — children always render (no domain-logic gate).

## Routes (live)
| Route | Status | Source | Deploy mirror |
|---|---|---|---|
| `/` (Cafework main: 4357 cafes + 5-dim + map + list + filters) | 200 | `src/app/page.tsx` | Vercel + GitHub Pages |
| `/landing/` (Stage 5 Day 1 hero + 5-dim demo + email capture) | 200 | `src/app/landing/page.tsx` | GitHub Pages only (Vercel pending manual deploy) |
| `/verify/?founder=1` (Stage 5 founder-only on-site verification) | 200 | `src/app/verify/page.tsx` | GitHub Pages only (Vercel pending manual deploy) |
| `/admin/?founder=1` (Stage 5 founder-only pilot metrics dashboard) | 200 | `src/app/admin/page.tsx` | GitHub Pages only (Vercel pending manual deploy) |

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
## Stage 5 Round 5 verification evidence (2026-08-29 — /admin shipped)
- `npm run test` → **91/91** passed in ~4.5 s (9 files; was 87/87 in 8 files pre-admin; +4 new tests in 1 file `src/app/admin/page.test.tsx`)
- `npm run typecheck` → exit 0
- `npm run build` → `next build` exit 0 in 12.9 s, **4** static routes (`/`, `/landing`, `/verify`, `/admin`) + `/_not-found` + `/icon.svg`
- `git log -1` → pending Round 5 commit (`feat(admin): add /admin route with founder gating + pilot metrics dashboard`)
- `git push origin main` → pending
- `gh workflow run "Deploy Cafework to GitHub Pages"` → pending
- HTML inspection (local `out/admin/index.html`, 9325 bytes): the static HTML shows the Suspense fallback "載入中…" because `useSearchParams` forces client-side render bailout (same pattern as /verify). Once JS loads, founder sees 4 metric cards with `—（unverified）` placeholder values + 1 recharts `BarChart` with 4 bars (height 0) + nav links to `/`, `/landing`, `/verify?founder=1`. Non-founder sees "founder-only access · 僅限 founder" + `?founder=1` hint.
- Founder gating: page calls `isFounder({query, envEmail})` from `src/lib/founder-auth.ts` (Round 3 utility) — same pattern as /verify, `?founder=1` query-flag grants access; non-founder sees access-denied screen
- Recharts SSR safety: AdminDashboard is a client component (`'use client'`) with `isAnimationActive={false}` and the parent uses an explicit height (`style={{height: 260}}`) so `ResponsiveContainer` doesn't bail in jsdom test environment
## Stage 5 Round 6 verification evidence (2026-08-29 — paywall demo upgrade shipped)
- `npm run test` → **109/109** passed in 4.69 s (12 files; was 91/91 in 9 files pre-paywall; +18 new tests in 3 files: `src/lib/paywall.test.ts` +8, `src/components/StripeCheckoutMock.test.tsx` +4, `src/components/PaywallGate.test.tsx` +6)
- `npm run typecheck` → exit 0
- `npm run build` → `next build` exit 0 in 12.8 s, **4** static routes (`/`, `/landing`, `/verify`, `/admin`) + `/_not-found` + `/icon.svg` (route count unchanged — paywall wraps existing `/`, no new route)
- `git log -1` → pending Round 6 commit `6f7ac12d Hermes Agent <hermes@minimax.ai>  feat(paywall): add demo paywall gate + Stripe Checkout mock UI for Stage 5 pilot`
- `git push origin main` → succeeded (0b92ca9b..6f7ac12d)
- `gh workflow run "Deploy Cafework to GitHub Pages"` → run `33252824838` conclusion `success`
- HTML inspection (local `out/index.html`, 140,125 bytes; same bytes on GitHub Pages mirror `https://openclawsean024-create.github.io/digital-nomad-cafe-map/`): `data-state="within-free-tier"` SSR-rendered in `<aside className="filters">` (initial `viewedCount=0` → 3 free views remaining). `<section className="paywall-banner">` shows "剩 3 次免費瀏覽（3/天）" text. All filter UI elements preserved (`01 / 工作條件`, `filter-group`, `最低 WiFi`, `最低安靜度`, `最低插座率`, `排序`).
- Mock-only boundary preserved: StripeCheckoutMock CTA writes 30-day ISO timestamp to existing `localStorage[deskbound-unlock-until-v1]` via `saveDemoUnlock()` helper from `src/lib/storage.ts`; no fetch, no Stripe.js, no analytics, no external network call. PaywallGate never blocks render — children always visible (open-access invariant preserved, 91 prior tests still pass).
- Open-access invariant: `canAccessCafe(*, null, *) === true` signature preserved (公開版策略) — `src/domain/cafes.ts` untouched; the paywall is a UI banner layer, not a domain-logic gate.
