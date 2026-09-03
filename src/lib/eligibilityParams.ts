/**
 * Shared eligibility validators.
 *
 * Single source of truth for pincode / income / employment-status rules. Used by
 * the URL hydration adapter AND by every manual form surface, deliberately: if
 * the adapter rejected a value that a form then accepted, a user would hit a
 * reject-then-accept loop (adapter drops the param, form renders, user retypes
 * the same value, form takes it).
 */

export type EmpStatus = 'salaried' | 'self_employed';

export type FailureReason =
  | 'missing'
  | 'not_numeric'
  | 'out_of_range'
  | 'bad_format'
  | 'unknown_enum';

/**
 * Result of normalising one param.
 *
 * Both members carry both keys (one optional) rather than relying on
 * discriminated-union narrowing: this project's tsconfig sets
 * `strictNullChecks: false`, under which TypeScript will not narrow a union by
 * its `ok` discriminant, so `r.reason` inside an `if (!r.ok)` block would not
 * type-check.
 */
export type Resolution<T> =
  | { ok: true; value: T; reason?: undefined }
  | { ok: false; value?: undefined; reason: FailureReason };

/**
 * Indian PIN codes never start with 0. The legacy form rule was /^\d{6}$/,
 * which wrongly accepted values like 012345.
 */
export const PINCODE_RE = /^[1-9][0-9]{5}$/;

/**
 * Monthly in-hand income sanity band, in rupees.
 *
 * The floor matches the loosest rule that already existed in the codebase
 * (the listing bar's 1000) so that hydration never rejects a value a user
 * could have typed by hand. The ceiling is a typo guard, not a product rule.
 */
export const MONTHLY_INCOME_MIN = 1_000;
export const MONTHLY_INCOME_MAX = 10_000_000;

export const EMP_STATUS_OPTIONS: ReadonlyArray<{ value: EmpStatus; label: string }> = [
  { value: 'salaried', label: 'Salaried' },
  { value: 'self_employed', label: 'Self-employed' },
];

export const isValidPincode = (value: string): boolean => PINCODE_RE.test(value.trim());

export const isValidMonthlyIncome = (value: number): boolean =>
  Number.isFinite(value) && value >= MONTHLY_INCOME_MIN && value <= MONTHLY_INCOME_MAX;

export const isEmpStatus = (value: unknown): value is EmpStatus =>
  value === 'salaried' || value === 'self_employed';

export const normalizePincode = (raw: string | null | undefined): Resolution<string> => {
  const value = (raw ?? '').trim();
  if (!value) return { ok: false, reason: 'missing' };
  if (!PINCODE_RE.test(value)) return { ok: false, reason: 'bad_format' };
  return { ok: true, value };
};

/**
 * Parse a monthly salary as it may arrive from a partner link: "50,000",
 * "₹ 50000", "Rs. 50,000", "INR 50000".
 *
 * Returns rupees per month. No unit conversion happens here — see toBreIncome.
 */
export const normalizeMonthlySalary = (raw: string | null | undefined): Resolution<number> => {
  const value = (raw ?? '').trim();
  if (!value) return { ok: false, reason: 'missing' };

  const stripped = value
    .replace(/(?:₹|\bINR\b|\bRs\.?)/gi, '')
    .replace(/[,\s_]/g, '');

  if (!/^\d+(?:\.\d+)?$/.test(stripped)) return { ok: false, reason: 'not_numeric' };

  const amount = Math.round(Number(stripped));
  if (!isValidMonthlyIncome(amount)) return { ok: false, reason: 'out_of_range' };

  return { ok: true, value: amount };
};

/**
 * Normalise an employment status to the value the eligibility API accepts.
 *
 * Accepts the partner short codes `s` (salaried) and `se` (self-employed) — the
 * format Credit Links documents in its entry URL spec — plus the hyphenated
 * form ("self-employed") and the spaced, underscored and concatenated variants,
 * in any case. Only ever EMITS the underscore form `self_employed`, which is
 * what every existing call site sends and what the API matches on. Emitting the
 * hyphen would silently break employment matching while still returning a
 * plausible-looking card set.
 */
export const normalizeEmpStatus = (raw: string | null | undefined): Resolution<EmpStatus> => {
  const value = (raw ?? '').trim();
  if (!value) return { ok: false, reason: 'missing' };

  const key = value.toLowerCase().replace(/[^a-z]/g, '');
  if (key === 'salaried' || key === 's') return { ok: true, value: 'salaried' };
  if (key === 'selfemployed' || key === 'se') return { ok: true, value: 'self_employed' };

  return { ok: false, reason: 'unknown_enum' };
};

/**
 * Map a monthly in-hand income to the value the eligibility API's
 * `inhandIncome` field expects.
 *
 * The API takes MONTHLY rupees, confirmed three ways: the per-card dialog
 * labels the field "In-hand Income (₹ / month)", the listing bar labels it
 * "Monthly Income (₹)", and journeyTrack forwards it as `monthly_income`.
 *
 * So this is an identity function, and it must stay one unless the API's
 * contract changes. It exists so the unit has exactly one documented home: if
 * the API ever switches to annual, the multiplier goes here and nowhere else.
 */
export const toBreIncome = (monthlyInr: number): number => monthlyInr;
