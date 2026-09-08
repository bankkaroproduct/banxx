"use client";

import { useEffect, useState } from 'react';
import { loadEligibleAliases } from '@/lib/eligibilityStore';
import { getCardAlias } from '@/utils/cardAlias';

/**
 * The eligible-card set resolved at the start of the journey.
 *
 * The homepage entry form is the beginning of the main flow, so by the time a
 * user reaches Card Genius, Category Genius or Beat My Card their eligibility
 * has already been resolved and cached. Each of those views previously showed
 * the full catalogue regardless, which meant a user filtered down to the cards
 * they qualify for on the listing could still be recommended a card they do
 * not. This reads the one cached result rather than re-asking or re-deriving.
 *
 * Returns null when no eligibility has been resolved — a direct visit that
 * skipped the entry form. That is deliberately "do not filter" rather than a
 * new blocking prompt on flows that never had one.
 *
 * Reads on mount rather than during render because sessionStorage is not
 * available server-side and would desync hydration.
 */
export function useEligibleAliases(): string[] | null {
  const [aliases, setAliases] = useState<string[] | null>(null);

  useEffect(() => {
    setAliases(loadEligibleAliases());
  }, []);

  return aliases;
}

/**
 * Filter a result list down to the eligible set.
 *
 * A null set means eligibility was never resolved, so the list passes through
 * untouched. An empty set is a real answer — the user qualifies for nothing —
 * and correctly yields an empty list.
 *
 * Cards are matched on any of the alias fields the various endpoints use; the
 * listing, genius and beat-my-card payloads do not agree on one name.
 */
export function filterToEligible<T>(cards: T[], eligible: string[] | null): T[] {
  if (eligible === null) return cards;
  const set = new Set(eligible.map(String));
  return cards.filter((card) => {
    const c = card as { seo_card_alias?: string; card_alias?: string };
    const alias = getCardAlias(card as never) || c.seo_card_alias || c.card_alias;
    return alias ? set.has(String(alias)) : false;
  });
}
