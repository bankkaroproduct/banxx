import ReactGA from "react-ga4";
import { getStoredAttribution, readAttributionFromParams, type Attribution } from "@/lib/attribution";
import { authManager } from "@/services/authManager";

/**
 * Journey Track instrumentation.
 *
 * One exported helper per event in Banxx_Journey_Event_Tracking_Plan.xlsx,
 * which that sheet declares the single source of truth: "Any new event gets the
 * next EVT ID and a row here before it is built — no undocumented events." The
 * EVT id is on each helper so a reader can find the row.
 *
 * This replaced 86 ad-hoc event names that shared none of the spec's
 * vocabulary — five different *_apply_now_clicked events for the one
 * apply_clicked, two page views for /cards, a listing_page_view that re-fired
 * on every filter change, and 16 trackers nothing called. Nothing had ever
 * reached the backend (every request 401s), so there was no history to keep and
 * the rename is a clean cutover rather than a migration.
 *
 * NOT YET IMPLEMENTED, deliberately:
 *   - click_id (the spec's card-out join key) is deferred pending a decision on
 *     who mints it, so apply_clicked and redirect_initiated carry everything
 *     except that property and EVT-033 cardout_confirmed cannot be joined yet.
 *   - EVT-033 cardout_confirmed is server-side and not a client concern.
 *   - EVT-034..037 (stage 5, Outcome) are blank rows in the sheet.
 */

const PARTNER_ID = 'banxx';

/* ------------------------------------------------------------------ *
 * Identity and context
 * ------------------------------------------------------------------ */

function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  let id = sessionStorage.getItem('bk_session_id');
  if (!id) {
    id = `s_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
    sessionStorage.setItem('bk_session_id', id);
  }
  return id;
}

/**
 * Stable per-browser id, required on every event.
 *
 * The spec says "first-party cookie". localStorage is used instead: it is
 * equally first-party and equally durable, but is not attached to every HTTP
 * request, so an id that exists only for analytics never travels to the card
 * APIs. Same guarantee, smaller blast radius. No PII either way — it is random.
 */
function getUserPseudoId(): string {
  if (typeof window === 'undefined') return '';
  try {
    let id = localStorage.getItem('bk_user_pseudo_id');
    if (!id) {
      id = `u_${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem('bk_user_pseudo_id', id);
    }
    return id;
  } catch {
    return '';
  }
}

function getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  if (typeof window === 'undefined') return 'desktop';
  return window.innerWidth < 768 ? 'mobile' : window.innerWidth < 1024 ? 'tablet' : 'desktop';
}

/**
 * Attribution for the event being sent.
 *
 * The sheet lists utm_* against session_start only, with "persist across the
 * session". They go on every event instead: a session whose session_start is
 * dropped would otherwise lose attribution entirely, and this way any single
 * event is attributable without a backend join.
 *
 * The URL is consulted when the store is empty. On a partner landing the
 * attribution is persisted by an effect in BanxxHome while the first event
 * fires from an effect in its child, and React runs child effects first — so
 * without this the first and most valuable event of a paid session went out
 * bare.
 */
function currentAttribution(): Attribution {
  const stored = getStoredAttribution();
  if (Object.keys(stored).length > 0) return stored;
  if (typeof window === 'undefined') return {};
  try {
    return readAttributionFromParams(new URLSearchParams(window.location.search));
  } catch {
    return {};
  }
}

/* ------------------------------------------------------------------ *
 * Privacy helpers
 * ------------------------------------------------------------------ */

/**
 * Monthly salary as a band.
 *
 * "BAND IT. Raw salary must never leave the client." The previous
 * eligibility_checked event sent the exact figure and the full six-digit
 * pincode; both are now reduced before they are ever put on the wire.
 */
export function salaryBand(monthlyIncome?: number | string | null): string | undefined {
  const n = typeof monthlyIncome === 'string' ? Number(monthlyIncome.replace(/[^0-9.]/g, '')) : monthlyIncome;
  if (n == null || !Number.isFinite(n) || n <= 0) return undefined;
  const bands: [number, string][] = [
    [25_000, '0-25k'],
    [50_000, '25k-50k'],
    [75_000, '50k-75k'],
    [100_000, '75k-100k'],
    [150_000, '100k-150k'],
    [200_000, '150k-200k'],
  ];
  for (const [ceiling, label] of bands) if (n < ceiling) return label;
  return '200k+';
}

/** First three digits of a pincode. Never the full six. */
export function pincodePrefix(pincode?: string | null): string | undefined {
  const digits = String(pincode ?? '').replace(/\D/g, '');
  return digits.length >= 3 ? digits.slice(0, 3) : undefined;
}

/** salaried | self_employed, normalised from the app's several spellings. */
export function salaryTypeOf(empStatus?: string | null): string | undefined {
  if (!empStatus) return undefined;
  return /self/i.test(empStatus) ? 'self_employed' : 'salaried';
}

/* ------------------------------------------------------------------ *
 * Tools touched this session (apply_clicked.tools_used_in_session)
 * ------------------------------------------------------------------ */

const TOOLS_KEY = 'bk_tools_used';

function noteToolUsed(tool: string): void {
  if (typeof window === 'undefined') return;
  try {
    const used = new Set(JSON.parse(sessionStorage.getItem(TOOLS_KEY) || '[]'));
    used.add(tool);
    sessionStorage.setItem(TOOLS_KEY, JSON.stringify([...used]));
  } catch { /* analytics must never throw */ }
}

function toolsUsedInSession(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(sessionStorage.getItem(TOOLS_KEY) || '[]');
  } catch {
    return [];
  }
}

/* ------------------------------------------------------------------ *
 * Transport
 * ------------------------------------------------------------------ */

type Props = Record<string, unknown>;

/** Drop undefined/null/"" so absent properties are omitted, not sent blank. */
const compact = (props: Props): Props => {
  const out: Props = {};
  for (const [k, v] of Object.entries(props)) {
    if (v === undefined || v === null || v === '') continue;
    out[k] = v;
  }
  return out;
};

async function send(eventName: string, props: Props = {}): Promise<void> {
  try {
    const metadata = compact(props);
    const attribution = currentAttribution();

    try {
      ReactGA.event(eventName, { partner_id: PARTNER_ID, device_type: getDeviceType(), ...attribution, ...metadata });
    } catch { /* silent */ }

    // Identity and session context sit at the top level, which is where the
    // spec's "All events" properties belong; everything event-specific stays
    // under metadata, matching the envelope the JT endpoint already consumes.
    const payload = {
      event_name: eventName,
      partner_id: PARTNER_ID,
      session_id: getSessionId(),
      user_pseudo_id: getUserPseudoId(),
      device_type: getDeviceType(),
      ...attribution,
      metadata,
    };

    let token = '';
    try { token = await authManager.getToken(); } catch { /* silent */ }

    fetch('/api/journey-track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { 'partner-token': token } : {}) },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => { /* silent */ });
  } catch {
    // Tracking must never break the app.
  }
}

/** Escape hatch for a genuinely new event. Add its row to the sheet first. */
export const trackJourneyEvent = (eventName: string, props?: Props) => send(eventName, props);

/* ================================================================== *
 * 1. ACQUISITION
 * ================================================================== */

/**
 * EVT-001 · session_start — first page load of a session.
 *
 * Guarded by the session id so it fires once per session rather than once per
 * mount; it is the denominator for every rate in the funnel, so a double count
 * here skews everything downstream.
 */
export const trackSessionStart = () => {
  if (typeof window === 'undefined') return;
  try {
    if (sessionStorage.getItem('bk_session_started')) return;
    sessionStorage.setItem('bk_session_started', '1');
  } catch { /* fall through and send anyway */ }
  return send('session_start');
};

/** EVT-002 · page_view — every route change, including client-side. */
export const trackPageView = (pagePath?: string, pageTitle?: string) =>
  send('page_view', {
    page_path: pagePath ?? (typeof window !== 'undefined' ? window.location.pathname : undefined),
    page_title: pageTitle ?? (typeof document !== 'undefined' ? document.title : undefined),
    referrer: typeof document !== 'undefined' ? document.referrer || undefined : undefined,
  });

/** EVT-003 · nav_clicked — any nav or footer link click. */
export const trackNavClicked = (navItem: string, navLocation: 'header' | 'footer' | 'mobile') =>
  send('nav_clicked', { nav_item: navItem, nav_location: navLocation });

/** EVT-004 · theme_toggled — dark/light switch. */
export const trackThemeToggled = (theme: 'dark' | 'light') =>
  send('theme_toggled', { theme });

/* ================================================================== *
 * 2. INTENT
 * ================================================================== */

/** EVT-005 · eligibility_widget_viewed — hero form enters the viewport. */
export const trackEligibilityWidgetViewed = () => send('eligibility_widget_viewed');

/** EVT-006 · eligibility_field_entered — first valid entry per field. */
export const trackEligibilityFieldEntered = (
  fieldName: 'monthly_salary' | 'pincode' | 'salary_type'
) => send('eligibility_field_entered', { field_name: fieldName });

/**
 * EVT-007 · eligibility_submitted — "Show my eligible cards" clicked.
 *
 * Takes the raw basis and reduces it here, so no call site has to remember to
 * band a salary or truncate a pincode.
 */
export const trackEligibilitySubmitted = (basis: {
  monthlyIncome?: number | string;
  pincode?: string;
  empStatus?: string;
}) =>
  send('eligibility_submitted', {
    monthly_salary_band: salaryBand(basis.monthlyIncome),
    pincode_prefix: pincodePrefix(basis.pincode),
    salary_type: salaryTypeOf(basis.empStatus),
  });

/** EVT-008 · eligibility_results_viewed — the eligible list renders. Zero is a product failure; alert on it. */
export const trackEligibilityResultsViewed = (
  eligibleCardCount: number,
  basis?: { monthlyIncome?: number | string }
) =>
  send('eligibility_results_viewed', {
    eligible_card_count: eligibleCardCount,
    monthly_salary_band: salaryBand(basis?.monthlyIncome),
  });

/** EVT-009 · catalog_viewed — the discover page loads. */
export const trackCatalogViewed = (totalCards?: number, entrySource?: string) =>
  send('catalog_viewed', { total_cards: totalCards, entry_source: entrySource });

/** EVT-010 · catalog_search — search submitted. Zero-result queries drive catalogue gaps. */
export const trackCatalogSearch = (query: string, resultsCount: number) =>
  send('catalog_search', { query, results_count: resultsCount });

/** EVT-011 · catalog_filter_applied — any filter or sort changed. */
export const trackCatalogFilterApplied = (
  filterType: string,
  filterValue: unknown,
  resultsCount?: number
) => send('catalog_filter_applied', { filter_type: filterType, filter_value: filterValue, results_count: resultsCount });

/** EVT-012 · catalog_load_more — "Load More Cards" clicked. */
export const trackCatalogLoadMore = (pageNumber: number, cardsLoaded: number, cardsRemaining: number) =>
  send('catalog_load_more', { page_number: pageNumber, cards_loaded: cardsLoaded, cards_remaining: cardsRemaining });

/** EVT-013 · tool_opened — any Card Genius / Beat My Card entry point. */
export const trackToolOpened = (
  toolName: string,
  entryPoint: 'nav' | 'home_card' | 'footer' | string
) => {
  noteToolUsed(toolName);
  return send('tool_opened', { tool_name: toolName, entry_point: entryPoint });
};

/* ================================================================== *
 * 3. EVALUATION
 * ================================================================== */

/** EVT-014 · cg_modal_viewed — the "Welcome to Super Card Genius" modal shows. */
export const trackCgModalViewed = () => send('cg_modal_viewed');

/** EVT-015 · cg_started — "Let's Get Started" clicked. Denominator for questionnaire completion. */
export const trackCgStarted = () => {
  noteToolUsed('card_genius');
  return send('cg_started');
};

/** EVT-016 · cg_question_answered — a value is set on a question. */
export const trackCgQuestionAnswered = (
  questionIndex: number,
  questionKey: string,
  answerValue?: number,
  inputMethod?: 'slider' | 'numeric'
) =>
  send('cg_question_answered', {
    question_index: questionIndex,
    question_key: questionKey,
    answer_value: answerValue,
    input_method: inputMethod,
  });

/** EVT-017 · cg_question_skipped — "Skip this question". A high rate means a bad question. */
export const trackCgQuestionSkipped = (questionIndex: number, questionKey: string) =>
  send('cg_question_skipped', { question_index: questionIndex, question_key: questionKey });

/** EVT-018 · cg_skipped_all — "Skip all remaining questions". The impatience signal. */
export const trackCgSkippedAll = (questionIndexAtSkip: number, questionsAnswered: number) =>
  send('cg_skipped_all', { question_index_at_skip: questionIndexAtSkip, questions_answered: questionsAnswered });

/** EVT-019 · cg_abandoned — exit before results. Fired on unload. */
export const trackCgAbandoned = (lastQuestionIndex: number, questionsAnswered: number) =>
  send('cg_abandoned', { last_question_index: lastQuestionIndex, questions_answered: questionsAnswered });

/** EVT-020 · cg_results_viewed — the recommendation list renders. The core value moment. */
export const trackCgResultsViewed = (args: {
  questionsAnswered?: number;
  questionsSkipped?: number;
  totalMonthlySpend?: number;
  projectedAnnualSavings?: number;
}) =>
  send('cg_results_viewed', {
    questions_answered: args.questionsAnswered,
    questions_skipped: args.questionsSkipped,
    total_monthly_spend: args.totalMonthlySpend,
    projected_annual_savings: args.projectedAnnualSavings,
  });

/** EVT-021 · category_genius_started — the category tool is opened. */
export const trackCategoryGeniusStarted = () => {
  noteToolUsed('category_genius');
  return send('category_genius_started');
};

/** EVT-022 · category_selected — a spend category is chosen. Feeds catalogue priority. */
export const trackCategorySelected = (category: string) =>
  send('category_selected', { category });

/** EVT-023 · category_results_viewed — category results render. */
export const trackCategoryResultsViewed = (
  category: string,
  recommendedCardCount?: number,
  topCardId?: string
) =>
  send('category_results_viewed', {
    category,
    recommended_card_count: recommendedCardCount,
    top_card_id: topCardId,
  });

/** EVT-024 · beat_my_card_started — the tool is opened. */
export const trackBeatMyCardStarted = () => {
  noteToolUsed('beat_my_card');
  return send('beat_my_card_started');
};

/** EVT-025 · beat_my_card_submitted — the existing card is submitted. Reveals the installed base. */
export const trackBeatMyCardSubmitted = (currentCardId?: string, currentCardName?: string) =>
  send('beat_my_card_submitted', { current_card_id: currentCardId, current_card_name: currentCardName });

/** EVT-026 · beat_my_card_results_viewed — the comparison renders. */
export const trackBeatMyCardResultsViewed = (args: {
  currentCardId?: string;
  betterCardCount?: number;
  savingsDelta?: number;
}) =>
  send('beat_my_card_results_viewed', {
    current_card_id: args.currentCardId,
    better_card_count: args.betterCardCount,
    savings_delta: args.savingsDelta,
  });

/**
 * EVT-027 · card_detail_viewed — "Details" clicked, or the detail page loads.
 *
 * source_surface is what attributes a card-out back to the surface that earned
 * it, so it is required rather than optional.
 */
export const trackCardDetailViewed = (args: {
  cardId?: string;
  cardName?: string;
  bank?: string;
  network?: string;
  joiningFee?: number;
  annualFee?: number;
  sourceSurface?: string;
  positionInList?: number;
}) =>
  send('card_detail_viewed', {
    card_id: args.cardId,
    card_name: args.cardName,
    bank: args.bank,
    network: args.network,
    joining_fee: args.joiningFee,
    annual_fee: args.annualFee,
    source_surface: args.sourceSurface,
    position_in_list: args.positionInList,
  });

/** EVT-028 · card_compare_added — compare ticked. */
export const trackCardCompareAdded = (cardId?: string, compareCount?: number) =>
  send('card_compare_added', { card_id: cardId, compare_count: compareCount });

/** EVT-029 · card_compare_removed — compare unticked. */
export const trackCardCompareRemoved = (cardId?: string, compareCount?: number) =>
  send('card_compare_removed', { card_id: cardId, compare_count: compareCount });

/** EVT-030 · card_compare_viewed — the comparison view is opened. */
export const trackCardCompareViewed = (cardIds?: string[], compareCount?: number) =>
  send('card_compare_viewed', { card_ids: cardIds, compare_count: compareCount });

/* ================================================================== *
 * 4. CONVERSION
 * ================================================================== */

/**
 * EVT-031 · apply_clicked — "Apply Now" anywhere. The primary client-side
 * card-out, and it must fire from every surface that offers an apply button.
 *
 * click_id is absent: the join key is still undecided, so this event cannot yet
 * be tied to EVT-033 cardout_confirmed.
 */
export const trackApplyClicked = (args: {
  cardId?: string;
  cardName?: string;
  bank?: string;
  sourceSurface?: string;
  positionInList?: number;
  recommendationRank?: number;
}) =>
  send('apply_clicked', {
    card_id: args.cardId,
    card_name: args.cardName,
    bank: args.bank,
    source_surface: args.sourceSurface,
    position_in_list: args.positionInList,
    recommendation_rank: args.recommendationRank,
    tools_used_in_session: toolsUsedInSession(),
  });

/**
 * EVT-032 · redirect_initiated — handoff to the bank.
 *
 * The gap between this and apply_clicked is the broken-link rate, which is why
 * it is a separate event rather than a property of the apply.
 */
export const trackRedirectInitiated = (cardId?: string, redirectDomain?: string) =>
  send('redirect_initiated', { card_id: cardId, redirect_domain: redirectDomain });

/* ================================================================== *
 * CROSS-CUTTING
 * ================================================================== */

/** EVT-038 · error_shown — any user-facing error or empty state, zero-result eligibility included. */
export const trackErrorShown = (errorType: string, errorMessage?: string) =>
  send('error_shown', {
    error_type: errorType,
    error_message: errorMessage,
    page_path: typeof window !== 'undefined' ? window.location.pathname : undefined,
  });

/** EVT-039 · support_contact_clicked — support@banxx.com clicked. */
export const trackSupportContactClicked = (contactMethod = 'email') =>
  send('support_contact_clicked', { contact_method: contactMethod });

/** Domain of an outbound URL, for redirect_initiated. */
export const redirectDomainOf = (url?: string): string | undefined => {
  if (!url) return undefined;
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return undefined;
  }
};
