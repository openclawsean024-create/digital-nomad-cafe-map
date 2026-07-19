# Architecture Decisions

## D-001 — Single Next.js 16 entry point
Use `src/app/` as the only App Router. The legacy root `app/` was removed because dual routers caused alias and build conflicts.

## D-002 — Local-first degradation
The app must remain demonstrable without private Supabase, Stripe, Resend, or speedtest credentials. Community seed reads and local contributions/reviews/reminders are functional; unavailable paid/backend integrations are labeled truthfully instead of simulated as real transactions.

## D-003 — Transparent seed data
Pilot cafe names and addresses are marked as community seed/pending re-verification. The product does not fabricate real-time venue facts.

## D-004 — Five-dimensional work score
Use the SPEC weighting: WiFi 30%, quiet 30%, outlets 20%, price 10%, friendliness 10%. The score is implemented in a pure tested domain function.

## D-005 — Canonical deployment identity
The new Vercel project must be `digital-nomad-cafe-map`. The pre-existing `digital-nomad-cafe-map-prod` is a legacy naming mismatch and is not reused for this sprint.
