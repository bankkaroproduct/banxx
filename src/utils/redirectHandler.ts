/**
 * Redirect Handler Utility
 * Manages secure redirects to bank partner websites with interstitial page
 */

import { toast } from 'sonner';
import { cardService } from '@/services/cardService';
import { getStoredAttribution } from '@/lib/attribution';
import {
  appendAttribution,
  findPlaceholder,
  substitutePlaceholders,
} from '@/lib/outboundUrl';

const ALLOWED_DOMAINS = [
  'track.techtrack.in',
  'bankkaro.com',
  'platform.bankkaro.com',
  'sbicard.com',
  'hdfcbank.com',
  'axisbank.com',
  'idfcfirstbank.com',
  'icicibank.com',
  'kotak.com',
  'rblbank.com',
  'yesbank.in',
  'indusind.com',
  'hsbc.co.in',
  'americanexpress.com',
  'aubank.in',
  'federalbank.co.in',
  'cashkaro.com',
  'go2joy.in',
  'tectrack.in',
  'techtrack.in',
];

const REDIRECT_ANALYTICS_ENABLED = (process.env.NEXT_PUBLIC_ENABLE_REDIRECT_ANALYTICS || '').toString().toLowerCase() === 'true';

export interface RedirectParams {
  networkUrl?: string;
  bankName: string;
  bankLogo?: string;
  cardName: string;
  cardId?: string | number;
  cardAlias?: string;
  source?: string;
}

/**
 * Opens the redirect interstitial page in a new tab
 * @param params - Redirect parameters including bank and card details
 * @returns Window object of the newly opened tab, or null if blocked
 */
export const openRedirectInterstitial = async (params: RedirectParams): Promise<Window | null> => {
  const { bankName, bankLogo, cardName, cardId } = params;
  const normalizedNetworkUrl = (() => {
    if (!params.networkUrl) return '';
    // Clean placeholder params ({click_id}, {user_id}, etc.) before validation
    const cleaned = cleanUrl(params.networkUrl);
    if (!cleaned) return '';

    // Reject URLs with an obviously empty campaign_id (e.g. campaign_id=&…)
    if (/[?&]campaign_id=(&|$)/.test(cleaned)) {
      console.warn('Redirect handler: Network URL has empty campaign_id — skipping', cleaned);
      return '';
    }

    try {
      const parsed = new URL(cleaned);
      if (parsed.protocol !== 'https:' && !parsed.hostname.includes('localhost')) {
        console.warn('Redirect handler: Network URL must be HTTPS or localhost', cleaned);
        return '';
      }
      return parsed.toString();
    } catch {
      console.warn('Redirect handler: Invalid network URL provided', cleaned);
      return '';
    }
  })();

  // Domain check on API-supplied networkUrls.
  if (normalizedNetworkUrl && !isAllowedDomain(normalizedNetworkUrl)) {
    console.error(
      'Redirect handler: networkUrl is not a valid HTTPS URL — blocked',
      normalizedNetworkUrl
    );
    return null;
  }

  const destinationUrl = normalizedNetworkUrl;

  if (destinationUrl && findPlaceholder(destinationUrl)) {
    console.error(
      '[redirect] BLOCKED: catalogue URL contains an unsubstituted placeholder',
      { placeholder: findPlaceholder(destinationUrl), url: destinationUrl, source: 'catalogue' }
    );
    toast.error('This application link is misconfigured. Please try another card.');
    return null;
  }

  // Track the click event
  trackRedirectClick({
    cardId,
    cardName,
    bankName,
    targetUrl: destinationUrl || '',
  });

  // Hit get-link FIRST (no tab opened yet) so we have the resolved exit URL +
  // exit_id before opening anything. Falls back to the original URL if the API
  // fails so the redirect never breaks.
  let finalUrl = destinationUrl;
  let exitId: string | number | null = null;
  try {
    console.log('[get-link] requesting exit link for:', destinationUrl);
    const json: any = await cardService.getExitLink(destinationUrl);
    console.log('[get-link] response:', json);
    const data = json?.data ?? json ?? {};
    exitId =
      data.exitid ?? data.exit_id ?? data.exitId ?? data.exit_link_id ?? data.id ?? json?.exit_id ?? null;
    const resolved =
      data.url ?? data.link ?? data.redirect_url ?? data.exit_url ?? data.exit_link ?? null;
    if (typeof resolved === 'string' && resolved) finalUrl = resolved;
    console.log('[get-link] resolved →', { finalUrl, exitId });
  } catch (err) {
    console.error('[get-link] failed, falling back to original URL:', err);
  }

  // Attribution is appended AFTER get-link resolves, because get-link returns
  // the URL the user is actually sent to. Append-only and string-level: some
  // bank URLs are signed, so re-encoding or reordering the existing query can
  // invalidate them.
  const attribution = getStoredAttribution();
  finalUrl = appendAttribution(finalUrl, { p2: attribution.p2, p3: attribution.p3 });

  // The guard that was missing. finalUrl comes back from get-link and used to
  // go straight into the interstitial and then window.location.replace()
  // without ever being re-checked, which is how live {click_id} placeholders
  // reached production. Fail loudly instead: a blocked redirect with an error
  // is recoverable, a redirect to a broken tracking URL loses the conversion
  // and the attribution silently.
  const leaked = findPlaceholder(finalUrl);
  if (leaked) {
    console.error(
      '[redirect] BLOCKED: outbound URL contains an unsubstituted placeholder',
      { placeholder: leaked, url: finalUrl, source: 'get-link' }
    );
    toast.error('This application link is misconfigured. Please try another card.');
    return null;
  }

  // Build query parameters for the interstitial page (url is now already resolved)
  const queryParams = new URLSearchParams({
    url: finalUrl,
    bank: bankName,
    card: cardName,
  });

  if (bankLogo) {
    queryParams.append('logo', bankLogo);
  }

  if (cardId) {
    queryParams.append('cardId', String(cardId));
  }

  // Pass card alias + source so the interstitial can attach them (and the exit_id
  // resolved above) to the apply_redirect Journey Track event.
  if (params.cardAlias) {
    queryParams.append('alias', params.cardAlias);
  }

  if (params.source) {
    queryParams.append('source', params.source);
  }

  if (exitId != null) {
    queryParams.append('exitId', String(exitId));
  }

  // Now that get-link has resolved, open the redirect tab with the final URL.
  // 'noopener' prevents the new tab from scripting window.opener (tabnabbing).
  const interstitialUrl = `/redirect?${queryParams.toString()}`;
  try {
    const newWindow = window.open(interstitialUrl, '_blank', 'noopener');
    if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
      console.warn('Redirect handler: Popup blocked - user needs to allow popups');
      return null;
    }
    return newWindow;
  } catch (error) {
    console.error('Redirect handler: Failed to open redirect tab', error);
    return null;
  }
};

/**
 * Track redirect click events for analytics
 */
const trackRedirectClick = (data: {
  cardId?: string | number;
  cardName: string;
  bankName: string;
  targetUrl: string;
}) => {
  if (!REDIRECT_ANALYTICS_ENABLED) {
    return;
  }

  try {
    // Use sendBeacon for reliable tracking even if page unloads
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/redirect-click', JSON.stringify({
        event: 'apply_click',
        ...data,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
      }));
    }

    // Also log to console in development
    if (process.env.NODE_ENV !== 'production') {
      console.log('Redirect click tracked:', data);
    }
  } catch (error) {
    console.error('Failed to track redirect click:', error);
  }
};

/**
 * Extract bank name from card data
 */
export const extractBankName = (card: any): string => {
  // banks can be an object {name} or an array [{name}]
  const banks = card?.banks;
  const bankFromBanks = Array.isArray(banks) ? banks[0]?.name : banks?.name;
  return bankFromBanks ||
    card?.bank_name ||
    card?.bankName ||
    card?.name?.split(' ')[0] || // First word of card name as fallback
    'Bank';
};

/**
 * Extract bank logo from card data
 */
export const extractBankLogo = (card: any): string | undefined => {
  const banks = card?.banks;
  const logoFromBanks = Array.isArray(banks) ? banks[0]?.logo : banks?.logo;
  return logoFromBanks ||
    card?.bank_logo ||
    card?.bankLogo ||
    undefined;
};

/**
 * Validate that a URL belongs to an explicitly allowed domain (or subdomain thereof).
 * Must be HTTPS. Subdomains of allowed domains are permitted (e.g. platform.bankkaro.com).
 */
export const isAllowedDomain = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') return false;
    return ALLOWED_DOMAINS.some(
      domain =>
        parsed.hostname === domain ||
        parsed.hostname.endsWith('.' + domain)
    );
  } catch {
    return false;
  }
};

/**
 * Substitute the placeholders we have values for and drop the rest.
 *
 * Replaces the previous implementation, which had five defects:
 *   1. `.replace('{user_id}', ...)` was a string replace, so a second
 *      occurrence survived.
 *   2. `{click_id}` was replaced with an empty string, emitting `click_id=`.
 *      The strip loop then kept it, because "" contains no braces.
 *   3. The strip loop inspected only param VALUES, so a placeholder in the path
 *      or in a param key survived.
 *   4. The whole function was wrapped in a try/catch returning the raw URL on
 *      parse failure, and an unsubstituted `{...}` can make `new URL()` throw,
 *      so the failure path returned the URL with every placeholder intact.
 *   5. It substituted the partner's BRAND NAME into `{user_id}`, putting a
 *      partner name into a per-user field for every user.
 *
 * `{user_id}` now receives p2, the actual Credit Links user id.
 */
const cleanUrl = (rawUrl: string): string =>
  substitutePlaceholders(rawUrl.trim(), { p2: getStoredAttribution().p2 });

/**
 * Convenience helper to open card application flows from raw card objects
 */
export const redirectToCardApplication = async (card: any, overrides: Partial<RedirectParams> = {}): Promise<boolean> => {
  const rawUrl =
    overrides.networkUrl ??
    card?.network_url ??
    card?.cg_network_url ??
    card?.ck_store_url ??
    card?.network_url_2 ??
    card?.card_apply_link ??
    '';

  const url = cleanUrl(rawUrl);

  console.log('FINAL REDIRECT URL:', cleanUrl(rawUrl));

  console.log('REDIRECT URL FOR CARD:', {
    cardName: card.name || card.card_name,
    network_url: card.network_url,
    cg_network_url: card.cg_network_url,
    ck_store_url: card.ck_store_url,
    network_url_2: card.network_url_2,
    finalUrl: url,
  });

  if (
    !url ||
    url.trim() === '' ||
    url === 'null' ||
    url === 'undefined'
  ) {
    toast.error('Application link is not available for this card. Please check back later.');
    return false;
  }

  const windowRef = await openRedirectInterstitial({
    networkUrl: url,
    bankName: overrides.bankName ?? extractBankName(card),
    bankLogo: overrides.bankLogo ?? extractBankLogo(card),
    cardName: overrides.cardName ?? card?.name ?? 'Credit Card',
    cardId: overrides.cardId ?? card?.id,
    cardAlias: overrides.cardAlias ?? card?.seo_card_alias ?? card?.card_alias ?? card?.alias,
    source: overrides.source,
  });

  return Boolean(windowRef);
};
