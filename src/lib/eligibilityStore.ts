/**
 * Session-scoped eligibility basis.
 *
 * Hydration resolves eligibility once, globally, from the entry URL. The
 * per-card dialog previously kept its own per-alias prefill
 * (`eligibility_<alias>`), which cannot be pre-populated for every card in the
 * catalogue. So hydrated values are written to one global key and the per-card
 * dialog reads it as a fallback, which stops it re-asking for details the user
 * already supplied through the partner link.
 */

import type { EmpStatus } from './eligibilityParams';

const GLOBAL_KEY = 'banxx_eligibility';

export interface StoredEligibility {
  pincode?: string;
  /** Monthly rupees. */
  inhandIncome?: number;
  empStatus?: EmpStatus;
  /**
   * Card aliases the stored basis qualifies for, cached from the one
   * checkEligibility call that resolved them.
   *
   * The basis alone is not enough for the other flows: Card Genius, Category
   * Genius and Beat My Card each need the eligible set to filter their results,
   * and re-deriving it per view would mean an extra multi-second call to the
   * eligibility API on every screen. Resolved once at the entry point, read
   * everywhere after.
   */
  eligibleAliases?: string[];
}

export const perCardKey = (cardAlias: string) => `eligibility_${cardAlias}`;

export const loadEligibility = (): StoredEligibility => {
  if (typeof window === 'undefined') return {};
  try {
    const raw = sessionStorage.getItem(GLOBAL_KEY);
    return raw ? (JSON.parse(raw) as StoredEligibility) : {};
  } catch {
    return {};
  }
};

export const saveEligibility = (value: StoredEligibility): void => {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(GLOBAL_KEY, JSON.stringify(value));
  } catch {
    /* private mode / quota — prefill degrades, never throws */
  }
};

/**
 * The eligible set for the current session, or null when eligibility has not
 * been resolved yet.
 *
 * null and [] mean different things and must not be collapsed: null is "no
 * basis given, do not filter", while [] is "checked, qualifies for nothing" and
 * must filter everything out. Callers that treat a falsy value as "show all"
 * would silently show ineligible cards to a user who qualifies for none.
 */
export const loadEligibleAliases = (): string[] | null => {
  const { eligibleAliases } = loadEligibility();
  return Array.isArray(eligibleAliases) ? eligibleAliases : null;
};
