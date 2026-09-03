/**
 * Outbound apply-URL construction.
 *
 * Every function here operates on the URL as a STRING, never via `new URL()` +
 * `searchParams`. That is deliberate: `URL.toString()` re-encodes and can
 * reorder the query string, and some bank tracking URLs are signed or
 * hash-validated, so a normalising round-trip can invalidate them.
 */

import type { Attribution } from './attribution';

/** Matches any unfilled template placeholder such as {click_id} or {user_id}. */
export const PLACEHOLDER_RE = /\{[^}]*\}/;

export class UnsubstitutedPlaceholderError extends Error {
  readonly url: string;
  readonly placeholder: string;

  constructor(url: string, placeholder: string) {
    super(`Outbound URL still contains an unsubstituted placeholder: ${placeholder}`);
    this.name = 'UnsubstitutedPlaceholderError';
    this.url = url;
    this.placeholder = placeholder;
  }
}

export const findPlaceholder = (url: string): string | null => {
  const match = url.match(PLACEHOLDER_RE);
  return match ? match[0] : null;
};

/**
 * Throw if any `{...}` placeholder survived substitution.
 *
 * A previous deployment shipped live `{click_id}` placeholders in production
 * redirects, because the URL returned by get-link was never re-checked. Failing
 * loudly is the correct trade: a blocked redirect with an error is recoverable,
 * a redirect to a broken tracking URL loses the conversion and the attribution
 * with no signal at all.
 */
export const assertNoPlaceholders = (url: string): string => {
  const placeholder = findPlaceholder(url);
  if (placeholder) throw new UnsubstitutedPlaceholderError(url, placeholder);
  return url;
};

/** Split a URL into everything before the first '#' and the fragment. */
const splitFragment = (url: string): [string, string] => {
  const hashAt = url.indexOf('#');
  return hashAt === -1 ? [url, ''] : [url.slice(0, hashAt), url.slice(hashAt)];
};

/**
 * Remove any `key=value` pair whose key or value contains a placeholder.
 *
 * String-level on purpose, so pairs that are left alone come out byte-identical
 * to how they went in. A pair is dropped entirely rather than emptied: emitting
 * `click_id=` gives the bank a present-but-blank tracking id, which is worse
 * than not sending the key.
 */
export const stripPlaceholderParams = (url: string): string => {
  const [base, fragment] = splitFragment(url);
  const queryAt = base.indexOf('?');
  if (queryAt === -1) return base + fragment;

  const path = base.slice(0, queryAt);
  const kept = base
    .slice(queryAt + 1)
    .split('&')
    .filter((pair) => pair !== '' && !PLACEHOLDER_RE.test(pair));

  return path + (kept.length ? `?${kept.join('&')}` : '') + fragment;
};

/**
 * Substitute the placeholders we have real values for, then drop the rest.
 *
 * `{user_id}` receives p2, the Credit Links user id. The legacy implementation
 * substituted the partner's brand name here, which put a partner name into a
 * per-user field for every user.
 */
export const substitutePlaceholders = (
  url: string,
  attribution: Pick<Attribution, 'p2'> = {}
): string => {
  const withUserId = attribution.p2
    ? url.replace(/\{user_id\}/g, encodeURIComponent(attribution.p2))
    : url;
  return stripPlaceholderParams(withUserId);
};

/**
 * Append p2 and p3 to an already-resolved outbound URL.
 *
 * Append only. Existing params are never reordered or re-encoded. An absent
 * value means the key is omitted entirely, so the URL stays well-formed rather
 * than carrying `p2=`.
 */
export const appendAttribution = (
  url: string,
  attribution: Pick<Attribution, 'p2' | 'p3'> = {}
): string => {
  const pairs: string[] = [];
  if (attribution.p2) pairs.push(`p2=${encodeURIComponent(attribution.p2)}`);
  if (attribution.p3) pairs.push(`p3=${encodeURIComponent(attribution.p3)}`);
  if (pairs.length === 0) return url;

  const [base, fragment] = splitFragment(url);
  const separator = base.includes('?') ? (base.endsWith('?') || base.endsWith('&') ? '' : '&') : '?';

  return `${base}${separator}${pairs.join('&')}${fragment}`;
};
