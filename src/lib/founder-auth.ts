// Founder-only gating utility for SPEC §15.13 pilot tooling.
//
// Two routes accept this gate:
//   /verify  — cafe verification form (5-dim + speedtest + photo)
//   /admin   — pilot metrics dashboard
//
// Both are gated to the project founder only. In a static export (`output:
// 'export'`) we cannot rely on server-side auth; instead we use a pure
// deterministic function that any client page can call with a URL query
// string and a build-time injected env value (via `process.env.NEXT_PUBLIC_*`
// at build time, which Next.js inlines for static export).
//
// Two paths grant founder access:
//   1. query-flag: `?founder=1` — bookmarkable, zero-config path the founder
//      pastes into the address bar when navigating to /verify or /admin.
//   2. env-match: NEXT_PUBLIC_FOUNDER_EMAIL (build-time inlined) === the
//      email entered in a sign-in form on the page. Case-insensitive.
//
// Public visitors always see founder=false. This is intentionally
// permissive on the *client* — there is no real backend to enforce it — but
// it keeps mock data and founder-only screens out of public UX while
// staying within the Stage 5 "credentials not provided" boundary.

export type FounderCheck =
  | { isFounder: true; reason: 'env-match' | 'query-flag' }
  | { isFounder: false; reason: 'no-flag' };

export interface FounderCheckInput {
  /** Parsed query string from `useSearchParams()` or `new URLSearchParams(...)`. */
  query: URLSearchParams | null | undefined;
  /**
   * Build-time founder email (NEXT_PUBLIC_FOUNDER_EMAIL). Empty string or
   * null means "no founder configured" — every check returns false.
   */
  envEmail: string | null | undefined;
  /**
   * Optional user-entered email (e.g. from a sign-in form on the page).
   * When omitted, only the query-flag path can grant founder access.
   */
  userEmail?: string | null | undefined;
}

export function isFounder(input: FounderCheckInput): FounderCheck {
  // Query-flag wins — fastest path, no env needed.
  if (input.query?.get('founder') === '1') {
    return { isFounder: true, reason: 'query-flag' };
  }

  // Env-match path. Empty / whitespace env never matches.
  const env = typeof input.envEmail === 'string' ? input.envEmail.trim() : '';
  const user = typeof input.userEmail === 'string' ? input.userEmail.trim() : '';
  if (env.length > 0 && user.length > 0 && env.toLowerCase() === user.toLowerCase()) {
    return { isFounder: true, reason: 'env-match' };
  }

  return { isFounder: false, reason: 'no-flag' };
}

/**
 * Convenience: read NEXT_PUBLIC_FOUNDER_EMAIL from process.env in a way
 * that works under `output: 'export'` (Next.js inlines `NEXT_PUBLIC_*`
 * variables at build time). Tests can pass undefined to disable the
 * env-match path entirely.
 */
export function readFounderEmailFromEnv(): string | null {
  const raw = process.env.NEXT_PUBLIC_FOUNDER_EMAIL;
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : null;
}