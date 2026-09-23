# AGENTS.md — digital-nomad-cafe-map

## Project boundary

This repository is the Cafework product: a public, local-first directory for finding cafes that may support focused work. The v4 visual prototype has been confirmed by Sean; this milestone implements that approved direction in the formal React surface. It is still not a production-readiness claim.

Read these files in order before changing product behavior:

1. `../../AGENTS.md`
2. `PRD/SPEC.md`
3. `PRD/UI-SPEC.md`
4. `SOP.md`
5. `STATUS.md`

## Invariants

- Never present an unverified cafe metric as a measured fact. Unknown values must render as `尚無資料` or `待驗證`, never as `0`, `50`, or a fabricated score.
- Keep the public product free and browseable without an account. Do not add a paywall, checkout, or login CTA to the public exploration flow.
- Do not claim that localStorage, mock speed tests, mock email, or demo admin data are production integrations.
- Keep the imported OSM directory separate from community verification data. Imported presence is not verification.
- `dashboard.html` is the approved v4 visual baseline. Formal React UI must stay aligned with `PRD/UI-SPEC.md` and must not drift back to the legacy dashboard composition.
- Do not deploy, push, merge, or update Notion from this milestone.

## Acceptance references

All changes in this milestone must map to `PRD/SPEC.md` AC-001 through AC-008 and the layout/component rules in `PRD/UI-SPEC.md`.
