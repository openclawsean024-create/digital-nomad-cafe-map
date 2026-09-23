# SOP — digital-nomad-cafe-map

## Current milestone

The v4 prototype has been approved. This milestone implements the approved visual direction in the formal React surface while preserving the local-first and public-free boundaries:

- `PRD/SPEC.md` — one coherent v4 product contract.
- `PRD/UI-SPEC.md` — page-level UI and interaction contract.
- `dashboard.html` — approved standalone visual baseline.
- `src/components/CafeExplorer.tsx` + `src/app/globals.css` — formal implementation of the approved explorer flow.

## Canonical checks

Run from this directory:

```bash
npm ci --legacy-peer-deps
npm run test
npm run typecheck
npm run build
```

`npm ci` currently fails under npm 11 because `react-leaflet@4.2.1` declares a React 18 peer while this repo uses React 19. The legacy-peer-deps flag is a verification workaround only; dependency alignment is a separate task.

## Review gates

1. Planner: reconcile current product truth and write the bounded acceptance criteria in `PRD/SPEC.md`.
2. Developer: implement the approved UI and nullable evidence model in small increments.
3. Deterministic checks: run the commands above; record exit codes and output in the task handoff.
4. QA: inspect prototype at desktop and mobile widths; verify unknown-data states, filter interactions, modal close behavior, and keyboard focus.
5. Final reviewer: do not approve a production-readiness claim until real verification data and integrations are independently validated.

## Known risks

- `src/data/cafes.ts` currently coerces unknown imported values to `0`; this is a data-model/UI correctness issue for the next implementation milestone.
- The repository contains legacy root `components/`, `lib/`, and `dashboard.html` artifacts. They are not part of the canonical App Router runtime and must not be reintroduced into the product surface without an explicit migration plan.
- Supabase, Stripe, Resend, and speed-test integrations are not production-ready and are outside this milestone.
