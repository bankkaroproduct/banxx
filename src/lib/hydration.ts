/**
 * Credit Links URL hydration adapter.
 *
 * Entry URL shape:
 *   /?utm_source=..&utm_medium=affiliate&utm_campaign=..
 *    &p1=&p2=<user_id>&p3=<dsa_code>&sal=<monthly>&pin=<pincode>&st=<salary_type>
 *
 * The contract this file exists to enforce: a param that fails to resolve is
 * ABSENT from the result, never defaulted. A defaulted salary produces a wrong
 * card set that still looks plausible, which makes it invisible in UAT and
 * wrong in production.
 */

import {
  normalizeEmpStatus,
  normalizeMonthlySalary,
  normalizePincode,
  toBreIncome,
  type EmpStatus,
  type FailureReason,
} from './eligibilityParams';
import { readAttributionFromParams, type Attribution } from './attribution';

export type EligibilityField = 'inhandIncome' | 'pincode' | 'empStatus';

/** URL param name -> form field name. */
export const PARAM_FOR_FIELD: Record<EligibilityField, 'sal' | 'pin' | 'st'> = {
  inhandIncome: 'sal',
  pincode: 'pin',
  empStatus: 'st',
};

/**
 * Field order used for prefill focus. Salary first because it is the field a
 * partner link is most likely to get wrong and the one that most changes the
 * result set.
 */
const FIELD_ORDER: EligibilityField[] = ['inhandIncome', 'pincode', 'empStatus'];

export interface HydratedEligibility {
  /** Monthly rupees, as the eligibility API expects. Absent when unresolved. */
  inhandIncome?: number;
  pincode?: string;
  empStatus?: EmpStatus;
}

export interface FieldFailure {
  field: EligibilityField;
  param: 'sal' | 'pin' | 'st';
  /** Whether the param appeared in the URL at all. */
  present: boolean;
  reason: FailureReason;
}

export interface HydrationResult {
  /** Only resolved values. Never contains a substituted default. */
  eligibility: HydratedEligibility;
  /** True when all three eligibility params resolved: skip the form. */
  resolved: boolean;
  /** True when at least one eligibility param was present in the URL. */
  attempted: boolean;
  failures: FieldFailure[];
  /** Where to put focus when rendering the prefilled form. */
  firstUnresolvedField: EligibilityField | null;
  attribution: Attribution;
}

interface ParamReader {
  get(name: string): string | null;
}

/**
 * One structured line per hydration attempt.
 *
 * Records which params were present, which resolved, and the reason code for
 * each failure. Deliberately value-free: it never logs the salary or pincode.
 * That still tells a bad partner link apart from a bad mapping apart from an
 * API issue, which is what this is for, without putting a user's income into a
 * browser console and log retention. Journey Track already carries the actual
 * values to BankKaro's own backend.
 */
const logHydration = (result: HydrationResult, raw: Record<string, boolean>) => {
  const line = {
    event: 'banxx_hydration_attempt',
    resolved: result.resolved,
    attempted: result.attempted,
    present: raw,
    failures: result.failures.map((f) => ({
      param: f.param,
      present: f.present,
      reason: f.reason,
    })),
    attribution: {
      has_p2: Boolean(result.attribution.p2),
      has_p3: Boolean(result.attribution.p3),
      utm_source: result.attribution.utm_source ?? null,
      utm_campaign: result.attribution.utm_campaign ?? null,
    },
  };

  if (!result.attribution.p2 || !result.attribution.p3) {
    console.warn('[banxx:hydration] missing attribution', line);
  } else {
    console.info('[banxx:hydration]', line);
  }
};

export const hydrateFromParams = (params: ParamReader): HydrationResult => {
  const salRaw = params.get('sal');
  const pinRaw = params.get('pin');
  const stRaw = params.get('st');

  const sal = normalizeMonthlySalary(salRaw);
  const pin = normalizePincode(pinRaw);
  const st = normalizeEmpStatus(stRaw);

  const eligibility: HydratedEligibility = {};
  if (sal.ok) eligibility.inhandIncome = toBreIncome(sal.value);
  if (pin.ok) eligibility.pincode = pin.value;
  if (st.ok) eligibility.empStatus = st.value;

  const failures: FieldFailure[] = [];
  if (!sal.ok) {
    failures.push({ field: 'inhandIncome', param: 'sal', present: salRaw !== null, reason: sal.reason });
  }
  if (!pin.ok) {
    failures.push({ field: 'pincode', param: 'pin', present: pinRaw !== null, reason: pin.reason });
  }
  if (!st.ok) {
    failures.push({ field: 'empStatus', param: 'st', present: stRaw !== null, reason: st.reason });
  }

  const firstUnresolvedField =
    FIELD_ORDER.find((field) => failures.some((f) => f.field === field)) ?? null;

  const result: HydrationResult = {
    eligibility,
    resolved: failures.length === 0,
    attempted: [salRaw, pinRaw, stRaw].some((v) => v !== null),
    failures,
    firstUnresolvedField,
    attribution: readAttributionFromParams(params),
  };

  return result;
};

/**
 * Hydrate and emit the diagnostic log line. Split from hydrateFromParams so the
 * pure function stays testable without console noise.
 */
export const hydrateAndLog = (params: ParamReader): HydrationResult => {
  const result = hydrateFromParams(params);
  logHydration(result, {
    sal: params.get('sal') !== null,
    pin: params.get('pin') !== null,
    st: params.get('st') !== null,
    p1: params.get('p1') !== null,
    p2: params.get('p2') !== null,
    p3: params.get('p3') !== null,
  });
  return result;
};

/**
 * True when the URL carries any Credit Links parameter at all. Used by the
 * landing route to decide whether this is a partner arrival or organic traffic.
 */
export const hasPartnerParams = (params: ParamReader): boolean =>
  ['sal', 'pin', 'st', 'p2', 'p3', 'utm_source', 'utm_campaign'].some(
    (key) => params.get(key) !== null
  );
