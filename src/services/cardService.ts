import { authManager } from './authManager';

// All card API calls are proxied through /api/proxy to avoid CORS preflight failures
// on the external platform.bankkaro.com domain.
const BASE_URL = '/api/proxy';

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

  async getCardListing(params: {
    slug: string;
    banks_ids: number[];
    card_networks: string[];
    annualFees: string;
    credit_score: string;
    sort_by: string;
    free_cards: string;
    eligiblityPayload: {
      pincode?: string;
      inhandIncome?: string;
      empStatus?: string;
    };
    cardGeniusPayload: any[];
  }, signal?: AbortSignal) {
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

  async checkEligibility(params: {
    cardAlias: string;
    pincode: string;
    inhandIncome: string;
    empStatus: 'salaried' | 'self_employed';
  }) {
    const response = await fetch('https://bk-prod-external.bankkaro.com/sp/api/cg-eligiblity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pincode: params.pincode,
        inhandIncome: params.inhandIncome,
        empStatus: params.empStatus,
      }),
    });
    return response.json();
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
