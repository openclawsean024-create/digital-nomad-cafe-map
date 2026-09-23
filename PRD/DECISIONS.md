# Architecture Decisions · v4.0

## D-001 — One canonical App Router

Use `src/app/` as the only Next.js application entry point. Legacy root modules are archive material until a separate migration proves they are still needed.

## D-002 — Public discovery stays free

The public map/list flow has no account, subscription, checkout, or paywall. Product usefulness is measured by successful discovery and trustworthy evidence, not gated views.

## D-003 — Imported presence is not verification

OSM records provide a place to start. They do not prove Wi-Fi, seating, noise, opening status, or work friendliness. The UI must show this distinction.

## D-004 — Unknown values remain unknown

Null or missing observations must stay nullable through the data layer and render as `尚無資料`. Coercing missing evidence to zero is an implementation defect to fix before the formal page rewrite.

## D-005 — Prototype before React rewrite

`dashboard.html` is an independent visual prototype. Formal React changes wait for Sean's confirmation so the next implementation is based on an approved information architecture instead of another exploratory round.

## D-006 — Integrations are opt-in and explicit

Supabase, Stripe, Resend, speed-test APIs, and email capture remain out of scope until a separate contract defines consent, error handling, storage, and release verification.
