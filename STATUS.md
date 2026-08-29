# Sprint Status

- Project: digital-nomad-cafe-map
- Started: 2026-07-19
- State: wip — Stage 5 pilot-ready in progress; Stage 4 production deployment **done** (2026-08-29 verified); **Stage 5 deliverable 1/8 (/landing) shipped 2026-08-29**
- Build attempt 1: failed because the legacy root `app/` and required `src/app/` were both compiled after alias migration; legacy imports resolved against the new `src/` alias and were missing.
- Remediation: retired the legacy root App Router and kept `src/app/` as the single Next.js 16 entry point.
- Local evidence (re-verified 2026-08-29 after Stage 5 Round 2): **69/69** vitest tests pass; strict TypeScript pass (`tsc --noEmit` exit 0); `next build` exit 0 with **2** static routes (`/`, `/landing`, `_not-found`, `icon.svg`); production HTML payload = **139,721 bytes** (main) and **10,570 bytes** (`/landing`).
- Canonical sprint workspace: **/Users/sean/Program/digital-nomad-cafe-map** (the prior `/tmp/digital-nomad-cafe-map-dev` path referenced in earlier docs is no longer present in this environment; git history is intact on `main` @ `92f52661`).
- GitHub: `openclawsean024-create/digital-nomad-cafe-map` @ branch `main` @ `92f52661` (HEAD = 2026-08-29 19:58 +0800, by `Hermes Agent <hermes@minimax.ai>`; latest round pushed via `gh workflow run`).
- Vercel canonical project: `digital-nomad-cafe-map`
  - **Production URL**: https://digital-nomad-cafe-map.vercel.app/  → HTTP 200, served by Vercel edge (`x-vercel-cache: HIT`), content identical to GitHub Pages mirror. Note: Vercel has not auto-deployed from GitHub for this project — only the canonical URL was last deployed manually; the GitHub Pages mirror is now ahead of Vercel for the `/landing` route.
  - Asset (icon.svg) → HTTP 200, age 0 (fresh).
- GitHub Pages mirror: https://openclawsean024-create.github.io/digital-nomad-cafe-map/ → HTTP 200 (was 139,121 → now 139,721 bytes after /landing chunk addition). `/landing/` route is live at HTTP 200 (10,570 bytes), triggered via `gh workflow run "Deploy Cafework to GitHub Pages"` on 2026-08-29. GitHub Pages mirror is the canonical Stage 5 deployment target until Vercel CLI auth is restored.
- Constraint: no Notion changes
- P0 features verified live (HTML inspection of both URLs):
  1. City selector + 5-dim filter — cities visible: 台北/新北/台中/台南/高雄/桃園/新竹/基隆/屏東/金門; metric labels WiFi / 安靜 / 插座 / 價格 / 友善 all render.
  2. 5-dim rating cards — `.cafe-card` structure with `.metrics > .metric` × 3 visible (WiFi/安靜/插座; price/friendliness inferred from additional card sections).
  3. Map + list view toggle — `nav.mobile-tabs` with buttons 篩選 / 地圖 / 清單 present; Leaflet marker rendering path wired.
  4. Free-3-store paywall demo — "顯示前 200 間，總共 4357 間符合條件" footer present (top-200 visible by default, full dataset behind demo entitlement).
  5. On-site verification flow — schema and entitlement fallback wired (`src/lib/entitlement.ts`), running in demo mode because no credentials.
- **Stage 5 SPEC §15.13 deliverables progress** (Day 1 ready target):
  - [x] **Deliverable 1/8 — /landing route live** (Round 2 commit `92f52661`): SPEC hero copy "Find a cafe that actually lets you work…" + 5-dim demo cards (WiFi/安靜/插座/價格/友善) + email capture mock form (writes to localStorage `deskbound-pilot-emails-v1`) + back link to /. GitHub Pages URL `/landing/` HTTP 200. Email form is mock-only — no Mailchimp/Resend wiring (credentials not provided per boundary §4).
  - [ ] Deliverable 2/8 — /verify route (founder-only gating + speedtest mock + 5-dim form + photo upload schema) → Round 4
  - [ ] Deliverable 3/8 — /admin route (founder-only gating + pilot metrics dashboard) → Round 5
  - [ ] Deliverable 4/8 — paywall demo upgrade (3/天 gate + Stripe Checkout mock UI) → Round 6
  - [ ] Deliverable 5/8 — city reminder cron template + Resend mock email template → Round 7
  - [ ] Deliverable 6/8 — FOUNDER_CHECKLIST.md (Day 1-14 actions, 5 Go/No-Go gates, community post drafts, interview script, Taipei 50 店 seed template) → Round 8
  - [ ] Deliverable 7/8 — STATUS.md + PROJECT_STATE.md → Stage 5 ready (this round partially updates; final state at Round 9)
  - [ ] Deliverable 8/8 — Full verification (tests/typecheck/build/5 URLs all 200) → Round 9
- Known production integration boundary (unchanged): Supabase / Stripe / Resend / speedtest credentials were not supplied. UI degrades to local persistence + explicit demo entitlement; backend schema in `supabase/`. All metric values render as `—` (unverified) because no real verification data exists yet. Email capture on /landing is mock-only and does NOT call any external service.
- Test count note: prior doc text said "65/65 tests pass" with "7 static routes" — both numbers drifted during Hermes Agent's Aug 8 commit series (commits `05af79c6` … `bb757dfd` consolidated fixtures and routes). The re-verified numbers above (69/69 tests, 2 static routes + icon.svg) are authoritative as of Stage 5 Round 2.