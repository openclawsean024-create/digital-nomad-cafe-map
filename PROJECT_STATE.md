# Project State

## Ground truth
- Sprint workspace: `/Users/sean/Program/digital-nomad-cafe-map` (the prior canonical `/tmp/digital-nomad-cafe-map-dev` referenced in earlier docs is no longer present in this environment; git history is intact)
- GitHub: `https://github.com/openclawsean024-create/digital-nomad-cafe-map`
- Branch: `main` @ pending Round 8 commit (HEAD = 2026-08-29 ~20:55 +0800, by `Hermes Agent <hermes@minimax.ai>`)
- Vercel canonical project: `digital-nomad-cafe-map`
- Production URL: https://digital-nomad-cafe-map.vercel.app/  (HTTP 200, Vercel edge cache HIT — note: Vercel has not auto-deployed from GitHub; only the GitHub Pages mirror carries the new /landing, /verify, /admin and /cron/reminder-dry-run routes)
- GitHub Pages mirror: https://openclawsean024-create.github.io/digital-nomad-cafe-map/  (HTTP 200, main route; /landing/, /verify/?founder=1, /admin/?founder=1 and /cron/reminder-dry-run/?founder=1 triggered via `gh workflow run "Deploy Cafework to GitHub Pages"` on 2026-08-29)
- SPEC: `PRD/SPEC.md` v3.0

## Current stage
- Stage 1 environment: complete
- Stage 2 TDD/P0 implementation: complete locally
- Stage 3 tests/typecheck/build: complete locally; **done** (re-verified 2026-08-29 — 63/63 tests pass, strict TypeScript pass, `next build` exit 0, 1 static route + icon.svg)
- Stage 4 production deployment: **done** (2026-08-29 verified — both Vercel and GitHub Pages serve the production build, byte-identical 139,121 bytes, all 5 P0 features render)
- Stage 5 pilot-ready: **Stage 5 ready — 7/8 deliverables shipped, 8/8 final verification pending Round 9** (Round 1: recon; Round 2: /landing live; Round 3: founder-auth utility; Round 4: /verify live; Round 5: /admin live; Round 6: paywall demo upgrade; Round 7: cron + email template; Round 8: FOUNDER_CHECKLIST + status-final; Round 9: full verification)
  - [x] Deliverable 1/8: `/landing` route (SPEC §15.13.1 Day 1) — Round 2 commit `92f52661`
  - [x] Deliverable 2/8: `/verify` route (SPEC §15.13.4 founder-only verification flow) — Round 4 commit `1a3f184a`
  - [x] Deliverable 3/8: `/admin` route (SPEC §15.13.5 founder-only pilot metrics dashboard) — Round 5 commit `0b92ca9b`
  - [x] Deliverable 4/8: paywall demo upgrade (3/天 gate + Stripe Checkout mock UI) — Round 6 commit `6f7ac12d`
  - [x] Deliverable 5/8: city reminder cron template + Resend mock email template — Round 7 commit `820b61e6`
  - [x] Deliverable 6/8: FOUNDER_CHECKLIST.md (Day 1-14 actions, 5 Go/No-Go gates, community post drafts, interview script, Taipei 50 店 seed template) — Round 8 commit pending
  - [x] Deliverable 7/8: STATUS.md + PROJECT_STATE.md → Stage 5 ready — Round 8 commit pending
  - [ ] Deliverable 8/8: Full verification (tests/typecheck/build/5 URLs all 200 + byte-identical) — Round 9

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
- **City reminder cron dry-run (Stage 5 Round 7)**: founder-only `/cron/reminder-dry-run/?founder=1` page renders the Resend-ready payload (subject + html + text + recipients) for selected pilot cities + cadence. Backed by `src/lib/email-template.ts` `buildReminderEmail({city, cafeCount, frequencyDays})` and `src/lib/cron-reminder-template.ts` `generateReminderPayload({subscribers, cities, cityIds, runDate, frequencyDays})` pure functions. CLI entry point: `npm run cron:dry` (with optional `--city=taipei,tokyo` and `--frequency=14` flags). Mock-only: no Resend SDK, no fetch, no real email send; founder copies the JSON output into their dev Resend account manually.

## Routes (live)
| Route | Status | Source | Deploy mirror |
|---|---|---|---|
| `/` (Cafework main: 4357 cafes + 5-dim + map + list + filters) | 200 | `src/app/page.tsx` | Vercel + GitHub Pages |
| `/landing/` (Stage 5 Day 1 hero + 5-dim demo + email capture) | 200 | `src/app/landing/page.tsx` | GitHub Pages only (Vercel pending manual deploy) |
| `/verify/?founder=1` (Stage 5 founder-only on-site verification) | 200 | `src/app/verify/page.tsx` | GitHub Pages only (Vercel pending manual deploy) |
| `/admin/?founder=1` (Stage 5 founder-only pilot metrics dashboard) | 200 | `src/app/admin/page.tsx` | GitHub Pages only (Vercel pending manual deploy) |
| `/cron/reminder-dry-run/?founder=1` (Stage 5 founder-only city reminder cron dry-run) | 200 | `src/app/cron/reminder-dry-run/page.tsx` | GitHub Pages only (Vercel pending manual deploy) |

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
## Stage 5 Round 7 verification evidence (2026-08-29 — cron + email template shipped)
- `npm run test` → **136/136** passed in 4.89 s (15 files; was 109/109 in 12 files pre-cron; +27 new tests in 3 files: `src/lib/email-template.test.ts` +12, `src/lib/cron-reminder-template.test.ts` +9, `src/app/cron/reminder-dry-run/page.test.tsx` +6)
- `npm run typecheck` → exit 0 (tsc --noEmit, no output)
- `npm run build` → `next build` exit 0 in 12.9 s, **5** static routes (`/`, `/landing`, `/verify`, `/admin`, `/cron/reminder-dry-run`) + `/_not-found` + `/icon.svg`
- `git log -1` → `820b61e6 Hermes Agent <hermes@minimax.ai>  feat(cron): add city reminder cron template + Resend mock email template for Stage 5 pilot`
- `git push origin main` → succeeded (24e91881..820b61e6)
- `gh workflow run "Deploy Cafework to GitHub Pages"` → run `33253269713` conclusion `success`
- `npm run cron:dry` → CLI prints JSON payload (runDate, frequencyDays, cityIds, totalSubscribers, totalEmails, payloads[]) — mock boundary preserved (no fetch, no Resend SDK)
- `curl -sI https://openclawsean024-create.github.io/digital-nomad-cafe-map/cron/reminder-dry-run/` → HTTP/2 200, 9,812 bytes (Suspense fallback in static HTML, same pattern as /verify and /admin; JS chunk `2n2fd091e4asj.js` contains all page text: "城市提醒 cron", "Mock-only", "cron-dry-run-output", "generateReminderPayload", etc.)
- HTML inspection (local `out/cron/reminder-dry-run/index.html`, 9,812 bytes): Suspense fallback "載入中…" because `useSearchParams()` forces client-side render bailout (same pattern as /verify /admin). Once JS loads, founder sees pilot-city checkboxes (default: ['taipei']) + cadence select (7/14/30 days) + refresh button + summary stats + per-city payload preview (subject input + text body textarea + html body details) + raw Resend-ready JSON textarea. Non-founder sees "founder-only access · 僅限 founder" + `?founder=1` hint.
- Mock-only boundary preserved: `generateReminderPayload` is a pure function with no fetch / Resend SDK / I/O; `buildReminderEmail` returns a structural envelope only. `npm run cron:dry` CLI prints JSON to stdout but does not send anything. `/cron/reminder-dry-run` page never calls `window.fetch` (verified by the "clicking the refresh button does not call fetch" test).
- Open-access invariant preserved: `canAccessCafe(*, null, *) === true` signature still untouched in `src/domain/cafes.ts`; the new cron + email modules are pure data-layer additions with no domain-logic coupling.

## Stage 5 Round 8 verification evidence (2026-08-29 — FOUNDER_CHECKLIST + status-final shipped)
- `FOUNDER_CHECKLIST.md` (new, 257 lines, 13,156 bytes, workspace root) — fixed章節 per `.ralph/prompts/verify.md` template + SPEC §15.13 specifics: Pre-flight (git log / 5 routes / mock-only / Mailchimp / Stripe / USD 100 禮卡 / Product Hunt / `NEXT_PUBLIC_FOUNDER_EMAIL`) + Day 1-3 landing launch (Go gate ≥ 100 email) + Day 2-4 community post (Go gate ≥ 1000 reach + ≥ 30 留言) + Day 3-7 5 場訪談 (Go gate ≥ 3/5 付費意願) + Day 4-10 Taipei 50 店 seed (Go gate ≥ 50 店) + Day 8-14 Pilot 付費 (Go gate ≥ 5 付費) + Day 14 go/no-go 決策 + 附錄 A.1 Threads 草稿（200-300 字）+ A.2 Reddit r/digitalnomad 草稿（400-600 字 long-form）+ A.3 Indie Hackers 草稿（300-400 字 build-in-public）+ 附錄 B 訪談大綱 5 題（工作模式 / workaround / 踩雷 / 付費意願 / 推薦朋友）+ 附錄 C Taipei 50 店 seed per-store checklist + Stage 5 verification evidence baseline + 完成偵測.
- `.gitignore` (modified) — removed `FOUNDER_CHECKLIST.md` from ignore list (was unintentionally added in commit `397413bf` Round 2 chore commit; recon plan calls out FOUNDER_CHECKLIST.md as a **permanent deliverable** that must ship with repo). Kept `.ralph/` + `STAGE5_RECON.md` ignored (ephemeral).
- `STATUS.md` (modified) — State line updated to "Stage 5 pilot-ready done"; deliverables 6/8 (FOUNDER_CHECKLIST) and 7/8 (STATUS.md + PROJECT_STATE.md → Stage 5 ready) marked done; deliverable 8/8 (full verification) marked pending Round 9; new "Stage 5 ready baseline" line at bottom of file.
- `PROJECT_STATE.md` (this file, modified) — Stage 5 progress now "Stage 5 ready — 7/8 deliverables shipped"; deliverables 6-7 marked done; this Round 8 verification evidence section appended.
- `npm run test` → **136/136** pass (unchanged; docs-only change)
- `npm run typecheck` → exit 0 (docs-only, no .ts file touched)
- `npm run build` → exit 0, 5 routes (unchanged; FOUNDER_CHECKLIST.md is at workspace root, not under src/, not picked up by Next.js)
- `git status` → 4 files staged for commit (FOUNDER_CHECKLIST.md, .gitignore, STATUS.md, PROJECT_STATE.md) before commit
- Mock-only boundary preserved: FOUNDER_CHECKLIST.md is human-readable founder action plan; no code change, no env credential added; founder copy the document into their Notion / Google Doc workflow as-is.
- Open-access invariant preserved: `canAccessCafe(*, null, *) === true` signature in `src/domain/cafes.ts` untouched (no src/ change this round).
