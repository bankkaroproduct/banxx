/**
 * Credit Links attribution store.
 *
 * p2 (user_id) and p3 (dsa_code) arrive once, on the entry URL, and have to
 * survive everything the user does afterwards: chip edits, filter changes,
 * navigating into a card detail page, and a page refresh. The URL only carries
 * them on the landing hit, so they are mirrored into sessionStorage.
 *
 * p1 is reserved for future use: accepted, stored, passed through, never parsed.
 */

const STORAGE_KEY = 'banxx_attribution';

export interface Attribution {
  p1?: string;
  p2?: string;
  p3?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
}

export const ATTRIBUTION_KEYS: ReadonlyArray<keyof Attribution> = [
  'p1',
  'p2',
  'p3',
  'utm_source',
  'utm_medium',
  'utm_campaign',
];

/** Drop empty strings so `p1=` in the entry URL does not become a stored "". */
const compact = (input: Attribution): Attribution => {
  const out: Attribution = {};
  for (const key of ATTRIBUTION_KEYS) {
    const value = input[key];
    if (typeof value === 'string' && value.trim() !== '') out[key] = value;
  }
  return out;
};

export const readAttributionFromParams = (
  params: URLSearchParams | { get(name: string): string | null }
): Attribution =>
  compact(
    ATTRIBUTION_KEYS.reduce<Attribution>((acc, key) => {
      const value = params.get(key);
      if (value !== null) acc[key] = value;
      return acc;
    }, {})
  );

export const getStoredAttribution = (): Attribution => {
  if (typeof window === 'undefined') return {};
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? compact(JSON.parse(raw) as Attribution) : {};
  } catch {
    return {};
  }
};

/**
 * Merge freshly-seen params over anything already stored and persist.
 * URL values win, so a re-entry with a new dsa_code updates the session.
 */
export const persistAttribution = (incoming: Attribution): Attribution => {
  const merged = compact({ ...getStoredAttribution(), ...incoming });
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    } catch {
      /* private mode / quota — attribution degrades to URL-only, never throws */
    }
  }
  return merged;
};
