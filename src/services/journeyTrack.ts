import ReactGA from "react-ga4";
import { brandConfig } from "@/config/brand.config";
import { authManager } from "@/services/authManager";

const PARTNER_NAME = brandConfig.name;

function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  let sessionId = sessionStorage.getItem('bk_session_id');
  if (!sessionId) {
    sessionId = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    sessionStorage.setItem('bk_session_id', sessionId);
  }
  return sessionId;
}

function getDeviceType(): string {
  if (typeof window === 'undefined') return '';
  return window.innerWidth < 768 ? 'mobile' : window.innerWidth < 1024 ? 'tablet' : 'desktop';
}

interface JourneyEvent {
  event_name: string;
  metadata?: Record<string, unknown>;
}

async function sendJourneyEvent(event: JourneyEvent): Promise<void> {
  try {
    // 1. Send to GA4
    try {
      ReactGA.event(event.event_name, {
        partner_name: PARTNER_NAME,
        device_type: getDeviceType(),
        ...event.metadata,
      });
    } catch { /* silent */ }

    // 2. Send to JT backend with partner-token (backend resolves partner name from token)
    const payload = {
      event_name: event.event_name,
      session_id: getSessionId(),
      device_type: getDeviceType(),
      metadata: event.metadata || {},
    };

    // Get cached partner token
    let token = '';
    try { token = await authManager.getToken(); } catch { /* silent */ }

    // Call local Next.js proxy (no CORS), which forwards with partner-token server-to-server
    fetch('/api/journey-track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'partner-token': token } : {}),
      },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => { /* silent */ });
  } catch {
    // Never let tracking break the app
  }
}

// Generic escape hatch for any event not covered by a named helper below
export const trackJourneyEvent = (eventName: string, metadata?: Record<string, unknown>) =>
  sendJourneyEvent({ event_name: eventName, metadata });

// ============================================================
// HOMEPAGE (/) — 11 events
// ============================================================
export const trackHomePageView = () =>
  sendJourneyEvent({ event_name: 'home_page_view' });

export const trackHeroSearchBarFocused = () =>
  sendJourneyEvent({ event_name: 'hero_search_bar_focused' });

export const trackSearchSubmitted = (searchQuery?: string) =>
  sendJourneyEvent({ event_name: 'search_submitted', metadata: { search_query: searchQuery } });

export const trackSearchQueryTyped = (searchQuery?: string) =>
  sendJourneyEvent({ event_name: 'search_query_typed', metadata: { search_query: searchQuery } });

export const trackHeroExploreAllCardsClicked = (buttonPosition?: string) =>
  sendJourneyEvent({ event_name: 'hero_explore_all_cards_clicked', metadata: { button_position: buttonPosition } });

export const trackPicksCardDetailsClicked = (cardAlias?: string, cardName?: string, tabName?: string) =>
  sendJourneyEvent({ event_name: 'picks_card_details_clicked', metadata: { card_alias: cardAlias, card_name: cardName, tab_name: tabName } });

export const trackPicksLoadMoreClicked = (tabName?: string) =>
  sendJourneyEvent({ event_name: 'picks_load_more_clicked', metadata: { tab_name: tabName } });

export const trackHomepageSuperCardGeniusClicked = (toolName?: string, buttonPosition?: string) =>
  sendJourneyEvent({ event_name: 'homepage_super_card_genius_clicked', metadata: { tool_name: toolName, button_position: buttonPosition } });

export const trackHomepageBeatMyCardClicked = (toolName?: string, buttonPosition?: string) =>
  sendJourneyEvent({ event_name: 'homepage_beat_my_card_clicked', metadata: { tool_name: toolName, button_position: buttonPosition } });

export const trackHomepageCategoryCardGeniusClicked = (toolName?: string, buttonPosition?: string) =>
  sendJourneyEvent({ event_name: 'homepage_category_card_genius_clicked', metadata: { tool_name: toolName, button_position: buttonPosition } });

export const trackAboutSubscribeClicked = (destinationUrl?: string) =>
  sendJourneyEvent({ event_name: 'about_subscribe_clicked', metadata: { destination_url: destinationUrl } });

// ============================================================
// DISCOVER (/discover) — 18 events
// ============================================================
export const trackDiscoverPageView = () =>
  sendJourneyEvent({ event_name: 'discover_page_view' });

export const trackDiscoverSearchBarFocused = () =>
  sendJourneyEvent({ event_name: 'discover_search_bar_focused' });

export const trackDiscoverSearchQueryTyped = (searchQuery?: string) =>
  sendJourneyEvent({ event_name: 'discover_search_query_typed', metadata: { search_query: searchQuery } });

export const trackDiscoverSearchSubmitted = (searchQuery?: string) =>
  sendJourneyEvent({ event_name: 'discover_search_submitted', metadata: { search_query: searchQuery } });

export const trackEligibilityDetailsFilled = (pincode?: string, monthlyIncome?: string | number, employmentStatus?: string) =>
  sendJourneyEvent({ event_name: 'eligibility_details_filled', metadata: { pincode, monthly_income: monthlyIncome, employment_status: employmentStatus } });

export const trackEligibilityCheckClicked = () =>
  sendJourneyEvent({ event_name: 'eligibility_check_clicked' });

export const trackEligibilityChecked = (pincode?: string, monthlyIncome?: string | number, employmentStatus?: string, eligibleCardsCount?: number) =>
  sendJourneyEvent({ event_name: 'eligibility_checked', metadata: { pincode, monthly_income: monthlyIncome, employment_status: employmentStatus, eligible_cards_count: eligibleCardsCount } });

export const trackFilterCategorySelected = (category?: string) =>
  sendJourneyEvent({ event_name: 'filter_category_selected', metadata: { category } });

export const trackFilterFeeRangeSelected = (feeRange?: string) =>
  sendJourneyEvent({ event_name: 'filter_fee_range_selected', metadata: { fee_range: feeRange } });

export const trackFilterNetworkSelected = (network?: string) =>
  sendJourneyEvent({ event_name: 'filter_network_selected', metadata: { network } });

export const trackListingFiltersSelected = (filterType?: string, filterValue?: string) =>
  sendJourneyEvent({ event_name: 'listing_filters_selected', metadata: { filter_type: filterType, filter_value: filterValue } });

export const trackFiltersCleared = () =>
  sendJourneyEvent({ event_name: 'filters_cleared' });

export const trackListingClearAllFilters = () =>
  sendJourneyEvent({ event_name: 'listing_clear_all_filters' });

export const trackListingPageView = (totalCards?: number, displayedCount?: number) =>
  sendJourneyEvent({ event_name: 'listing_page_view', metadata: { total_cards: totalCards, displayed_count: displayedCount } });

export const trackCardClicked = (cardAlias?: string, cardName?: string, bank?: string, position?: number) =>
  sendJourneyEvent({ event_name: 'card_clicked', metadata: { card_alias: cardAlias, card_name: cardName, bank, position } });

export const trackCardDetailsClicked = (cardAlias?: string, cardName?: string, position?: number) =>
  sendJourneyEvent({ event_name: 'card_details_clicked', metadata: { card_alias: cardAlias, card_name: cardName, position } });

export const trackListingApplyNowClicked = (cardAlias?: string, source?: string) =>
  sendJourneyEvent({ event_name: 'listing_apply_now_clicked', metadata: { card_alias: cardAlias, source } });

export const trackListingLoadMoreClicked = () =>
  sendJourneyEvent({ event_name: 'listing_load_more_clicked' });

// ============================================================
// CARD DETAILS (/cards/{alias}) — 7 events
// ============================================================
export const trackCardDetailsPageView = (cardAlias?: string, cardName?: string, bank?: string, source?: string) =>
  sendJourneyEvent({ event_name: 'card_details_page_view', metadata: { card_alias: cardAlias, card_name: cardName, bank, source } });

export const trackCardDetailsBackClicked = (cardAlias?: string) =>
  sendJourneyEvent({ event_name: 'card_details_back_clicked', metadata: { card_alias: cardAlias } });

export const trackCardDetailsBreadcrumbClicked = (linkName?: string, cardAlias?: string) =>
  sendJourneyEvent({ event_name: 'card_details_breadcrumb_clicked', metadata: { link_name: linkName, card_alias: cardAlias } });

export const trackCardDetailsBenefitsViewed = (cardAlias?: string) =>
  sendJourneyEvent({ event_name: 'card_details_benefits_viewed', metadata: { card_alias: cardAlias } });

export const trackCardDetailsApplyNowClicked = (cardAlias?: string, cardName?: string) =>
  sendJourneyEvent({ event_name: 'card_details_apply_now_clicked', metadata: { card_alias: cardAlias, card_name: cardName } });

export const trackCardDetailsCheckEligibilityClicked = (cardAlias?: string, cardName?: string) =>
  sendJourneyEvent({ event_name: 'card_details_check_eligibility_clicked', metadata: { card_alias: cardAlias, card_name: cardName } });

export const trackCardDetailsCompareClicked = (cardAlias?: string, cardName?: string) =>
  sendJourneyEvent({ event_name: 'card_details_compare_clicked', metadata: { card_alias: cardAlias, card_name: cardName } });

// ============================================================
// ABOUT (/about) — 3 events
// ============================================================
export const trackAboutPageView = () =>
  sendJourneyEvent({ event_name: 'about_page_view' });

export const trackAboutSubscribeSectionViewed = () =>
  sendJourneyEvent({ event_name: 'about_subscribe_section_viewed_about' });

export const trackAboutSubscribeClickedAbout = (destinationUrl?: string) =>
  sendJourneyEvent({ event_name: 'about_subscribe_clicked_about', metadata: { destination_url: destinationUrl } });

// ============================================================
// SUPER CARD GENIUS (/tools/super-card-genius) — 7 events
// ============================================================
export const trackScgSpendsFilled = (spends?: unknown) =>
  sendJourneyEvent({ event_name: 'scg_spends_filled', metadata: { spends } });

export const trackScgCalculateClicked = () =>
  sendJourneyEvent({ event_name: 'scg_calculate_clicked' });

export const trackScgResultsView = (resultsCount?: number, topCard?: string) =>
  sendJourneyEvent({ event_name: 'scg_results_view', metadata: { results_count: resultsCount, top_card: topCard } });

export const trackScgResultCardClicked = (cardAlias?: string, cardName?: string, position?: number) =>
  sendJourneyEvent({ event_name: 'scg_result_card_clicked', metadata: { card_alias: cardAlias, card_name: cardName, position } });

export const trackScgApplyNowClicked = (recommendedCard?: string, cardAlias?: string) =>
  sendJourneyEvent({ event_name: 'scg_apply_now_clicked', metadata: { recommended_card: recommendedCard, card_alias: cardAlias } });

export const trackScgCompareClicked = (cardAlias?: string, cardName?: string) =>
  sendJourneyEvent({ event_name: 'scg_compare_clicked', metadata: { card_alias: cardAlias, card_name: cardName } });

export const trackScgResetClicked = () =>
  sendJourneyEvent({ event_name: 'scg_reset_clicked' });

// ============================================================
// CATEGORY CARD GENIUS (/tools/category-card-genius) — 8 events
// ============================================================
export const trackCcgCategorySelected = (category?: string) =>
  sendJourneyEvent({ event_name: 'ccg_category_selected', metadata: { category } });

export const trackCcgSpendsFilled = (category?: string, spends?: unknown) =>
  sendJourneyEvent({ event_name: 'ccg_spends_filled', metadata: { category, spends } });

export const trackCcgCalculateClicked = (category?: string) =>
  sendJourneyEvent({ event_name: 'ccg_calculate_clicked', metadata: { category } });

export const trackCcgResultsView = (category?: string, resultsCount?: number, topCard?: string) =>
  sendJourneyEvent({ event_name: 'ccg_results_view', metadata: { category, results_count: resultsCount, top_card: topCard } });

export const trackCcgResultCardClicked = (cardAlias?: string, cardName?: string, category?: string, position?: number) =>
  sendJourneyEvent({ event_name: 'ccg_result_card_clicked', metadata: { card_alias: cardAlias, card_name: cardName, category, position } });

export const trackCcgApplyNowClicked = (recommendedCard?: string, cardAlias?: string, category?: string) =>
  sendJourneyEvent({ event_name: 'ccg_apply_now_clicked', metadata: { recommended_card: recommendedCard, card_alias: cardAlias, category } });

export const trackCcgCompareClicked = (cardAlias?: string, cardName?: string, category?: string) =>
  sendJourneyEvent({ event_name: 'ccg_compare_clicked', metadata: { card_alias: cardAlias, card_name: cardName, category } });

export const trackCcgResetClicked = () =>
  sendJourneyEvent({ event_name: 'ccg_reset_clicked' });

// ============================================================
// BEAT MY CARD (/tools/beat-my-card) — 8 events
// ============================================================
export const trackBmcCardSelected = (cardName?: string, cardAlias?: string) =>
  sendJourneyEvent({ event_name: 'bmc_card_selected', metadata: { card_name: cardName, card_alias: cardAlias } });

export const trackBmcSpendsFilled = (spends?: unknown) =>
  sendJourneyEvent({ event_name: 'bmc_spends_filled', metadata: { spends } });

export const trackBmcRevealCardClicked = (currentCard?: string) =>
  sendJourneyEvent({ event_name: 'bmc_reveal_card_clicked', metadata: { current_card: currentCard } });

export const trackBmcResultsView = (currentCard?: string, recommendedCard?: string, savings?: number) =>
  sendJourneyEvent({ event_name: 'bmc_results_view', metadata: { current_card: currentCard, recommended_card: recommendedCard, savings } });

export const trackBmcResultCardClicked = (cardAlias?: string, cardName?: string) =>
  sendJourneyEvent({ event_name: 'bmc_result_card_clicked', metadata: { card_alias: cardAlias, card_name: cardName } });

export const trackBmcApplyNowClicked = (recommendedCard?: string, cardAlias?: string, currentCard?: string) =>
  sendJourneyEvent({ event_name: 'bmc_apply_now_clicked', metadata: { recommended_card: recommendedCard, card_alias: cardAlias, current_card: currentCard } });

export const trackBmcCompareClicked = (cardAlias?: string, cardName?: string) =>
  sendJourneyEvent({ event_name: 'bmc_compare_clicked', metadata: { card_alias: cardAlias, card_name: cardName } });

export const trackBmcResetClicked = () =>
  sendJourneyEvent({ event_name: 'bmc_reset_clicked' });

// ============================================================
// ALL PAGES (GLOBAL) — 25 events
// ============================================================

// --- Navigation ---
export const trackNavLogoClicked = () =>
  sendJourneyEvent({ event_name: 'nav_logo_clicked' });

export const trackNavHomeClicked = (menuItem?: string) =>
  sendJourneyEvent({ event_name: 'nav_home_clicked', metadata: { menu_item: menuItem } });

export const trackNavAboutClicked = (menuItem?: string) =>
  sendJourneyEvent({ event_name: 'nav_about_clicked', metadata: { menu_item: menuItem } });

export const trackNavDiscoverClicked = (menuItem?: string) =>
  sendJourneyEvent({ event_name: 'nav_discover_clicked', metadata: { menu_item: menuItem } });

export const trackNavToolsDropdownOpened = () =>
  sendJourneyEvent({ event_name: 'nav_tools_dropdown_opened' });

export const trackNavToolSelected = (toolName?: string) =>
  sendJourneyEvent({ event_name: 'nav_tool_selected', metadata: { tool_name: toolName } });

export const trackNavBlogsClicked = (menuItem?: string) =>
  sendJourneyEvent({ event_name: 'nav_blogs_clicked', metadata: { menu_item: menuItem } });

export const trackNavSocialSelected = (socialPlatform?: string) =>
  sendJourneyEvent({ event_name: 'nav_social_selected', metadata: { social_platform: socialPlatform } });

// --- Footer ---
export const trackFooterQuickLinkClicked = (linkName?: string) =>
  sendJourneyEvent({ event_name: 'footer_quick_link_clicked', metadata: { link_name: linkName } });

export const trackFooterEmailClicked = (email?: string) =>
  sendJourneyEvent({ event_name: 'footer_email_clicked', metadata: { email } });

export const trackFooterBankkaroLogoClicked = () =>
  sendJourneyEvent({ event_name: 'footer_bankkaro_logo_clicked' });

export const trackFooterPrivacyPolicyClicked = () =>
  sendJourneyEvent({ event_name: 'footer_privacy_policy_clicked' });

export const trackFooterTermsClicked = () =>
  sendJourneyEvent({ event_name: 'footer_terms_clicked' });

// --- Comparison ---
export const trackCompareCardAdded = (cardId?: string | number, cardName?: string, source?: string) =>
  sendJourneyEvent({ event_name: 'compare_card_added', metadata: { card_id: cardId, card_name: cardName, source } });

export const trackCompareCardRemoved = (cardId?: string | number, cardName?: string) =>
  sendJourneyEvent({ event_name: 'compare_card_removed', metadata: { card_id: cardId, card_name: cardName } });

export const trackComparePanelViewed = (cardsCount?: number) =>
  sendJourneyEvent({ event_name: 'compare_panel_viewed', metadata: { cards_count: cardsCount } });

export const trackCompareNowClicked = (cardIds?: Array<string | number>) =>
  sendJourneyEvent({ event_name: 'compare_now_clicked', metadata: { card_ids: cardIds } });

// --- Eligibility Modal ---
export const trackEligibilityModalDetailsFilled = (pincode?: string, monthlyIncome?: string | number, employmentStatus?: string, cardAlias?: string) =>
  sendJourneyEvent({ event_name: 'eligibility_modal_details_filled', metadata: { pincode, monthly_income: monthlyIncome, employment_status: employmentStatus, card_alias: cardAlias } });

export const trackEligibilityModalCheckClicked = (cardAlias?: string) =>
  sendJourneyEvent({ event_name: 'eligibility_modal_check_clicked', metadata: { card_alias: cardAlias } });

export const trackEligibilityModalCancelClicked = (cardAlias?: string) =>
  sendJourneyEvent({ event_name: 'eligibility_modal_cancel_clicked', metadata: { card_alias: cardAlias } });

export const trackEligibilityModalClosed = (cardAlias?: string) =>
  sendJourneyEvent({ event_name: 'eligibility_modal_closed', metadata: { card_alias: cardAlias } });

export const trackEligibilityModalSubmitted = (cardAlias?: string, pincode?: string, monthlyIncome?: string | number, employmentStatus?: string, eligible?: boolean) =>
  sendJourneyEvent({ event_name: 'eligibility_modal_submitted', metadata: { card_alias: cardAlias, pincode, monthly_income: monthlyIncome, employment_status: employmentStatus, eligible } });

export const trackEligibilityModalPassed = (cardAlias?: string) =>
  sendJourneyEvent({ event_name: 'eligibility_modal_passed', metadata: { card_alias: cardAlias } });

export const trackEligibilityModalFailed = (cardAlias?: string, reason?: string) =>
  sendJourneyEvent({ event_name: 'eligibility_modal_failed', metadata: { card_alias: cardAlias, reason } });

// --- Redirect ---
export const trackApplyRedirect = (cardAlias?: string, source?: string, exitId?: string | number) =>
  sendJourneyEvent({ event_name: 'apply_redirect', metadata: { card_alias: cardAlias, source, exit_id: exitId } });
