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
