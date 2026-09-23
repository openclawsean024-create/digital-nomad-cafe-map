# Cafework Architecture · v4.0

## Canonical runtime

- Next.js 16 App Router under `src/app/`.
- React 19 explorer under `src/components/`.
- Leaflet + OpenStreetMap for map context; the list remains the fallback when tiles fail.
- Vitest for pure domain logic and component behavior.
- `output: 'export'` static build remains the current deployment shape, but deployment is not part of the v4 prototype milestone.

## Product surfaces

| Surface | Role | Current status |
|---|---|---|
| `src/app/page.tsx` | formal explorer runtime | existing v3 surface; rewrite deferred |
| `dashboard.html` | independent v4 visual prototype | current review artifact |
| `src/data/cafes-data.ts` | imported OSM seed records | 4,357 Taiwan cafe records |
| `src/domain/` | filtering, sorting, score and validation rules | existing tested layer; nullable cleanup pending |
| `supabase/` | possible shared persistence contract | not connected in this milestone |

## Data flow and trust boundary

1. Import OSM cafe location/name metadata.
2. Keep imported metadata separate from community observations.
3. Normalize observed Wi-Fi, noise, outlets, price, and stay-friendliness as nullable evidence.
4. Derive a work score only when the domain contract says the available evidence is sufficient.
5. Render missing evidence explicitly as `尚無資料` / `待驗證`.

The current `src/data/cafes.ts` adapter coerces missing numeric fields to `0`. That is a known implementation defect, not a product rule; correcting it is the first formal React milestone after prototype approval.

## Integration boundary

Supabase, Stripe, Resend, and speed-test services are not production integrations. LocalStorage and mock screens may help demonstrate a flow, but they must not be described as public sync, payment, email delivery, or measured network data.

## Migration sequence after prototype approval

1. Correct nullable data types and unknown-state filters.
2. Rebuild the explorer shell to match `PRD/UI-SPEC.md`.
3. Keep domain functions pure; add tests for unknown values and evidence states.
4. Remove or archive duplicate legacy root modules only after usage is confirmed.
5. Run a real verification pilot and update the release gate before deployment.
