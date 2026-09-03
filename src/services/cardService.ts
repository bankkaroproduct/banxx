import { authManager } from './authManager';
import type { EmpStatus } from '@/lib/eligibilityParams';

// All card API calls are proxied through /api/proxy to avoid CORS preflight failures
// on the external platform.bankkaro.com domain.
const BASE_URL = '/api/proxy';

/** Eligibility API. Called directly, not via the partner proxy. */
const ELIGIBILITY_URL = 'https://bk-prod-external.bankkaro.com/sp/api/cg-eligiblity';

export interface EligibilityCard {
  seo_card_alias?: string;
  card_alias?: string;
  eligible?: boolean;
  [key: string]: unknown;
}

export interface EligibilityResponse {
  status?: boolean | string;
  data?: EligibilityCard[];
  [key: string]: unknown;
}

/**
 * Aliases of the cards the eligibility API marked eligible.
 *
 * The response is the only eligibility signal available: the listing endpoint
 * does not filter by eligibility (see getCardListing), so filtering is done
 * client-side against these aliases.
 */
export const extractEligibleAliases = (response: EligibilityResponse): string[] => {
  const cards = Array.isArray(response?.data) ? response.data : [];
  return cards
    .filter((card) => card?.eligible === true)
    .map((card) => card?.seo_card_alias || card?.card_alias)
    .filter((alias): alias is string => Boolean(alias));
};

export interface SpendingData {
  amazon_spends?: number;
  flipkart_spends?: number;
  other_online_spends?: number;
  other_offline_spends?: number;
  grocery_spends_online?: number;
  online_food_ordering?: number;
  fuel?: number;
  dining_or_going_out?: number;
  flights_annual?: number;
  hotels_annual?: number;
  domestic_lounge_usage_quarterly?: number;
  international_lounge_usage_quarterly?: number;
  mobile_phone_bills?: number;
  electricity_bills?: number;
  water_bills?: number;

  insurance_car_or_bike_annual?: number;
  insurance_health_annual?: number;
  rent?: number;
  school_fees?: number;
  life_insurance?: number;
  offline_grocery?: number;
}

export const cardService = {
  async getInitBundle() {
    const response = await authManager.makeAuthenticatedRequest(
      `${BASE_URL}/cardgenius/init-bundle`,
      { method: 'GET' }
    );
    return response.json();
  },

  async getCardDetails(alias: string) {
    const response = await authManager.makeAuthenticatedRequest(
      `${BASE_URL}/cardgenius/cards/${alias}`,
      { method: 'GET' }
    );
    return response.json();
  },

  async calculateCardGenius(spendingData: SpendingData) {
    const payload: Required<SpendingData> = {
      amazon_spends: 0, flipkart_spends: 0, other_online_spends: 0, other_offline_spends: 0,
      grocery_spends_online: 0, online_food_ordering: 0, fuel: 0, dining_or_going_out: 0,
      flights_annual: 0, hotels_annual: 0, domestic_lounge_usage_quarterly: 0,
      international_lounge_usage_quarterly: 0, mobile_phone_bills: 0, electricity_bills: 0,
      water_bills: 0, insurance_car_or_bike_annual: 0, insurance_health_annual: 0,
      rent: 0, school_fees: 0, life_insurance: 0, offline_grocery: 0,
      ...spendingData,
    };
    const response = await authManager.makeAuthenticatedRequest(
      `${BASE_URL}/cardgenius/calculate`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    );
    const data = await response.json();
    console.log('[calculateCardGenius] response:', data);
    return data;
  },

  /**
   * Partner card listing.
   *
   * IMPORTANT: this endpoint is called as a GET and only `slug` and `sort_by`
   * reach the network. It does NOT filter by eligibility, bank, network, fee or
   * credit score. The previous signature accepted all of those plus an
   * `eligiblityPayload`, built a query string from two of them, and silently
   * discarded the rest, so callers were constructing payloads that went
   * nowhere. The signature is now limited to what is actually sent.
   *
   * Consequence for eligibility: filtering happens client-side against the
   * aliases returned by checkEligibility.
   */
  async getCardListing(
    params: { slug?: string; sort_by?: string },
    signal?: AbortSignal
  ) {
    const qs = new URLSearchParams();
    if (params.slug) qs.set('slug', params.slug);
    if (params.sort_by) qs.set('sort_by', params.sort_by);
    const url = `${BASE_URL}/cardgenius/cards${qs.toString() ? `?${qs}` : ''}`;
    const response = await authManager.makeAuthenticatedRequest(url, { method: 'GET', signal });
    return response.json();
  },

  async getCardDetailsByAlias(alias: string) {
    const response = await authManager.makeAuthenticatedRequest(
      `${BASE_URL}/cardgenius/cards/${alias}`,
      { method: 'GET' }
    );
    return response.json();
  },

  async getPartnerCards(signal?: AbortSignal) {
    const response = await authManager.makeAuthenticatedRequest(
      `${BASE_URL}/cardgenius/cards`,
      { method: 'GET', signal }
    );
    return response.json();
  },

  /**
   * Eligibility check. THE single call site for the eligibility API.
   *
   * `inhandIncome` is MONTHLY rupees. Confirmed by the labels on every form
   * surface ("In-hand Income (₹ / month)", "Monthly Income (₹)") and by
   * journeyTrack forwarding it as `monthly_income`. Route monthly values
   * through toBreIncome() so the unit has one documented home.
   *
   * `empStatus` must be the underscore form `self_employed`. The hyphenated
   * form Credit Links sends would not match and would still return a
   * plausible-looking card set.
   *
   * Not proxied: this is a direct cross-origin POST, matching the existing
   * behaviour. Moving it behind /api/proxy is a separate change.
   */
  async checkEligibility(
    params: {
      pincode: string;
      inhandIncome: number | string;
      empStatus: EmpStatus;
    },
    options: { timeoutMs?: number; signal?: AbortSignal } = {}
  ): Promise<EligibilityResponse> {
    const { timeoutMs = 12000 } = options;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(ELIGIBILITY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: options.signal ?? controller.signal,
        body: JSON.stringify({
          pincode: params.pincode,
          inhandIncome: String(params.inhandIncome),
          empStatus: params.empStatus,
        }),
      });
      return (await response.json()) as EligibilityResponse;
    } finally {
      clearTimeout(timer);
    }
  },

  /**
   * Generate the partner exit link for a given destination URL.
   * Proxied through /api/proxy/get-link → https://platform.bankkaro.com/partner/get-link
   * (the proxy attaches the partner-token). The response carries the exit_id used by
   * Journey Track to correlate the redirect, and the final URL to send the user to.
   */
  async getExitLink(url: string) {
    const response = await authManager.makeAuthenticatedRequest(
      `${BASE_URL}/get-link`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      }
    );
    return response.json();
  }
};
