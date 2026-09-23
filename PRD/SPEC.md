# Cafework Product Requirements · v4.0

> 整頓版 · 2026-09-21 · prototype milestone
> 本檔取代先前互相矛盾的 v3.0 / Stage 5 文件，作為目前唯一產品契約。

## 1. Product truth

### 1.1 Product

**Cafework** helps a digital nomad decide whether a cafe is suitable for focused work before walking there. The first release is a free, public directory with a map, a searchable list, and transparent work-condition evidence.

### 1.2 Current state

- Imported directory: 4,357 OSM cafe records across 22 Taiwan administrative areas.
- Verification state: most records have no community measurements. The product is not yet safe to present as a reliable live recommendation service.
- Runtime: Next.js static export with a local-first contribution path; backend integrations are not production-ready.
- This milestone: reset the product contract, approve the standalone visual prototype, and implement the approved explorer in the formal React surface. The implementation is verified locally; production readiness is still blocked by missing real verification data and backend integrations.

### 1.3 Problem

General map products answer “where is a cafe?” but not “can I work there for two hours?”. The missing signals are Wi-Fi, outlets, noise, stay limits, price, and evidence freshness. Cafework earns trust by showing what is known, what is unknown, and how a record was verified.

### 1.4 Primary user

Freelancer, remote worker, or digital nomad in an unfamiliar Taiwan city who needs a workable cafe in the next 30 minutes.

Secondary users are local contributors who have just visited a cafe and can add a small, honest verification.

## 2. Goals and non-goals

### Goals

1. Help a user narrow the directory to a short list in under 30 seconds.
2. Make evidence status more prominent than an invented score.
3. Make the same search usable as a list when the map is unavailable.
4. Give a visitor a low-friction path to add or update work-condition data.
5. Establish a visual language that can be implemented in the existing Next.js app after review.

### Non-goals for v4

- No account, login, subscription, checkout, paywall, or premium unlock.
- No claim of real-time opening hours, live Wi-Fi availability, or guaranteed seating.
- No global coverage promise; Taiwan is the current data boundary.
- No admin analytics surface in the public exploration flow.
- No real email delivery, Stripe, speed-test API, or shared review persistence in the prototype.
- No rewrite of legacy data/import modules as part of the visual reset.

## 3. User journeys

### J1 · Find a place for deep work

1. User opens Cafework.
2. User searches a city or chooses a city scope.
3. User applies one or two high-signal filters.
4. User scans list cards with evidence status and unknown fields.
5. User opens a cafe detail and decides whether to navigate there.

Success: a candidate is selected without needing to infer meaning from a generic star rating.

### J2 · Verify a cafe after visiting

1. User opens a cafe detail.
2. User selects `我到過這裡，補一筆`.
3. User enters only observed conditions.
4. UI confirms local capture and clearly states whether sync is available.

Success: the user understands what was recorded and what was not published.

### J3 · Recover from incomplete data

1. User sees `尚無資料` for a metric.
2. UI explains that the field is unverified.
3. User can filter on known values without treating unknown as zero.

Success: missing data reduces confidence, but does not masquerade as a negative or a measured number.

## 4. Functional requirements

| ID | Requirement | Priority | Acceptance |
|---|---|---:|---|
| FR-001 | Search by cafe name, address, or city | P0 | Results update without a page reload and empty state explains next step |
| FR-002 | Scope by Taiwan city/area | P0 | Scope is visible in the control row and card metadata |
| FR-003 | Quick filters for Wi-Fi, outlets, quiet, and stay limit | P0 | Active filters are removable and unknown values are not treated as matches |
| FR-004 | Sort by work fit or freshness where supported | P1 | Labels describe the actual sort behavior |
| FR-005 | Cafe card with evidence state | P0 | Card exposes status, known metrics, unknown metrics, source/freshness |
| FR-006 | Cafe detail view | P0 | Detail view includes all five dimensions and a contribution CTA |
| FR-007 | Map/list parity | P0 | Selecting a marker and selecting a card open the same detail state; list works without map |
| FR-008 | Local contribution flow | P1 | Form records only observed fields and reports local-only behavior truthfully |
| FR-009 | Responsive/mobile exploration | P0 | No horizontal overflow at 390px; list-first mobile layout remains usable |
| FR-010 | Public, free exploration | P0 | No login, payment, or upgrade gate appears in the public flow |

## 5. Data contract and trust model

### 5.1 Five dimensions

| Dimension | Meaning | Unknown display |
|---|---|---|
| Wi-Fi | observed download speed in Mbps | `尚無資料` |
| 安靜 | observed focus/noise level, 1–5 | `尚無資料` |
| 插座 | approximate seat/socket availability | `尚無資料` |
| 價格 | observed median spend in NTD | `尚無資料` |
| 友善 | tolerance for longer work sessions, 1–5 | `尚無資料` |

Imported OSM presence is not verification. A work score may be calculated only when the weighting rules and required inputs are defined by the data layer; otherwise the UI displays `— 未驗證`.

### 5.2 Evidence states

- `開放資料`: imported from OSM; location/name may still need review.
- `部分驗證`: at least one community observation exists.
- `已驗證`: the verification policy for all displayed core fields is satisfied.
- `待重新確認`: evidence is stale or contradictory.

The current prototype uses these states as visual labels but does not fabricate measured values.

## 6. Non-functional requirements

- Accessibility: WCAG 2.1 AA target; keyboard-visible focus; 44px touch targets.
- Performance: first useful list should be readable quickly on a mid-range mobile device; avoid loading the whole directory into the initial DOM when formal implementation begins.
- Reliability: list/search/filter must remain useful if map tiles or external APIs fail.
- Privacy: do not send emails, photos, or reviews to an external service without an explicit backend contract and consent copy.
- Content honesty: all prototype-only, mock, and local-only states are visible in the UI.

## 7. Acceptance criteria for this milestone

- **AC-001** — `PRD/SPEC.md` removes contradictory Stage 5/premium/global claims and states the current evidence boundary.
- **AC-002** — `PRD/UI-SPEC.md` defines the information architecture, visual tokens, responsive behavior, content rules, and component states.
- **AC-003** — `dashboard.html` is a product-specific Cafework prototype; no generic dashboard modules remain.
- **AC-004** — Prototype demonstrates search, city scope, filters, sort, card selection, detail view, and contribution modal.
- **AC-005** — Prototype visibly distinguishes imported/unknown/verified states and includes a prototype-only disclaimer.
- **AC-006** — Prototype is usable at desktop and 390px widths without page-level horizontal overflow.
- **AC-007** — Existing application tests, typecheck, and static build remain green; no production integration is claimed.
- **AC-008** — Formal React page rewrite remains blocked until Sean confirms the prototype direction.

## 8. Deferred implementation plan

After prototype confirmation:

1. Fix the data model so unknown measurements remain nullable instead of being coerced to `0`.
2. Replace the current explorer composition with the approved layout, keeping domain functions pure and tested.
3. Add component tests for unknown states, filter semantics, modal focus/close behavior, and mobile navigation.
4. Reconcile the duplicate legacy root modules and remove them only with a separate migration review.
5. Run a real data-verification pilot before calling the product production-ready.

## 9. Release gate

This milestone is complete only when the prototype is visually reviewed. It is not a deployment milestone. Do not update production URLs, Vercel, GitHub Pages, or the canonical Notion Project DB from this work.
