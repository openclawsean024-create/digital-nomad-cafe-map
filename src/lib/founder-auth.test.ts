import { describe, expect, it } from 'vitest';
import { isFounder } from './founder-auth';

describe('isFounder (SPEC §15.13 founder-only gating utility)', () => {
  it('query-flag (?founder=1) returns founder=true with reason "query-flag"', () => {
    const query = new URLSearchParams('founder=1');
    const result = isFounder({ query, envEmail: null, userEmail: null });
    expect(result).toEqual({ isFounder: true, reason: 'query-flag' });
  });

  it('env-match (envEmail === userEmail) returns founder=true with reason "env-match"', () => {
    const query = new URLSearchParams('');
    const result = isFounder({
      query,
      envEmail: 'founder@deskbound.test',
      userEmail: 'founder@deskbound.test',
    });
    expect(result).toEqual({ isFounder: true, reason: 'env-match' });
  });

  it('env-match is case-insensitive (FOUNDER@x == founder@x)', () => {
    const query = new URLSearchParams('');
    const result = isFounder({
      query,
      envEmail: 'Founder@DeskBound.test',
      userEmail: 'founder@deskbound.test',
    });
    expect(result).toEqual({ isFounder: true, reason: 'env-match' });
  });

  it('no query flag and no env returns founder=false with reason "no-flag"', () => {
    const query = new URLSearchParams('');
    const result = isFounder({ query, envEmail: null, userEmail: null });
    expect(result).toEqual({ isFounder: false, reason: 'no-flag' });
  });

  it('empty env string with no query returns founder=false (empty env is not a match)', () => {
    const query = new URLSearchParams('');
    const result = isFounder({
      query,
      envEmail: '',
      userEmail: 'anyone@deskbound.test',
    });
    expect(result).toEqual({ isFounder: false, reason: 'no-flag' });
  });

  it('non-matching user email against matching env returns founder=false', () => {
    const query = new URLSearchParams('');
    const result = isFounder({
      query,
      envEmail: 'founder@deskbound.test',
      userEmail: 'someone-else@example.com',
    });
    expect(result).toEqual({ isFounder: false, reason: 'no-flag' });
  });
});