"use client";
import React, { useState, useEffect, useRef, useMemo } from "react";
import { analytics } from "@/services/analytics";
import {
  trackDiscoverPageView,
  trackDiscoverSearchBarFocused,
  trackDiscoverSearchQueryTyped,
  trackDiscoverSearchSubmitted,
  trackEligibilityDetailsFilled,
  trackEligibilityCheckClicked,
  trackEligibilityChecked,
  trackFilterCategorySelected,
  trackFilterFeeRangeSelected,
  trackFilterNetworkSelected,
  trackListingFiltersSelected,
  trackFiltersCleared,
  trackListingClearAllFilters,
  trackListingPageView,
  trackCardClicked,
  trackCardDetailsClicked,
  trackListingApplyNowClicked,
  trackListingLoadMoreClicked,
} from "@/services/journeyTrack";
import { Link } from "@/components/Link";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter, X, ArrowUpDown, CheckCircle2, Sparkles, ShoppingBag, Utensils, Fuel, Plane, Coffee, ShoppingCart, CreditCard } from "lucide-react";
import { cardService, extractEligibleAliases, SpendingData } from "@/services/cardService";
import { EligibilityChips, type EligibilityBasis } from "@/components/EligibilityChips";
import { hydrateAndLog, type HydrationResult, type EligibilityField } from "@/lib/hydration";
import { persistAttribution } from "@/lib/attribution";
import { saveEligibility } from "@/lib/eligibilityStore";
import {
  EMP_STATUS_OPTIONS,
  isValidPincode,
  normalizeMonthlySalary,
  toBreIncome,
  type EmpStatus,
} from "@/lib/eligibilityParams";
import { Badge } from "@/components/ui/badge";
import GeniusDialog from "@/components/GeniusDialog";
import { CompareToggleIcon } from "@/components/comparison/CompareToggleIcon";
import { ComparePill } from "@/components/comparison/ComparePill";
import { useComparison } from "@/contexts/ComparisonContext";
import { redirectToCardApplication } from "@/utils/redirectHandler";
import { feeCalc } from "@/lib/feeUtils";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ChevronDown } from "lucide-react";
import confetti from 'canvas-confetti';
import { toast } from "sonner";
import { getCardAlias, getCardKey } from "@/utils/cardAlias";
import { getCardStatus, canApply } from "@/utils/cardStatus";

/**
 * Frontend corrections for card_type values that are wrong in the backend data.
 * Keys are lowercase card names. Values are the correct comma-separated network string.
 */
const CARD_NETWORK_CORRECTIONS: Record<string, string> = {
  'scapia credit card':                     'Visa',
  'axis airtel credit card':                'RuPay',
  'idfc first select credit card':          'Visa',
  'idfc first select':                      'Visa',
  'hdfc pixel play credit card':            'Visa',
  'rbl shoprite credit card':               'Visa,Mastercard',
  'sbi bpcl octane credit card':            'Visa,Mastercard',
  'zaggle zagg credit card':                'Visa,RuPay',
  'idfc first classic credit card':         'Visa',
  'idfc first classic':                     'Visa',
  'idfc first swyp credit card':            'Visa,Mastercard',
  'idfc first swyp':                        'Visa,Mastercard',
  'tata neu infinity sbi card':             'Visa,RuPay',
  'indianoil rbl bank credit card':         'Visa,Mastercard',
  'jupiter edge credit card':               'RuPay',
  'hdfc biz first credit card':             'Visa,Mastercard',
  'idfc first power credit card':           'Visa,Mastercard',
  'idfc first power':                       'Visa,Mastercard',
  'sbi elite card':                         'Visa,Mastercard,AmericanExpress',
  'sbi simply save credit card':            'Visa,Mastercard',
  'au altura plus credit card':             'Visa',
  'hdfc freedom credit card':               'Visa,Mastercard',
  'idfc first wow credit card':             'Visa',
  'idfc first wow':                         'Visa',
  'hdfc moneyback plus credit card':        'Visa',
  'rbl insignia preferred credit card':     'Visa,Mastercard',
  'au nomo credit card':                    'Visa',
  'irctc sbi platinum credit card':         'RuPay',
  'sbi card miles credit card':             'Visa,Mastercard',
  'rbl bank play credit card':              'Visa,Mastercard',
  'kotak mojo platinum credit card':        'Visa,Mastercard',
  'kotak indianoil platinum card':          'Visa,RuPay',
};

/** Returns the corrected card_type string for a card, or the original if no correction exists. */
const getCardNetworks = (card: any): string => {
  const name = (card.name || card.card_name || '').toLowerCase().trim();
  return CARD_NETWORK_CORRECTIONS[name] ?? (card.card_type || '');
};

/**
 * DOM ids for the eligibility inputs, used to focus the first field a partner
 * link failed to resolve.
 *
 * The listing renders the eligibility form twice, a mobile collapsible and a
 * desktop bar, and both are mounted at once. Duplicate ids would be invalid
 * HTML, so the mobile instance carries a "-m" suffix and the focus helper picks
 * the instance that is actually visible.
 */
const FIELD_INPUT_IDS: Record<EligibilityField, string> = {
  inhandIncome: 'elig-income',
  pincode: 'elig-pincode',
  empStatus: 'elig-emp-status',
};

const MOBILE_ID_SUFFIX = '-m';

const VALID_CATEGORIES = ['all', 'fuel', 'shopping', 'online-food', 'dining', 'grocery', 'travel', 'utility'];
const normalizeCategory = (value: string | null) => {
  if (!value) return 'all';
  return VALID_CATEGORIES.includes(value) ? value : 'all';
};

const CardListing = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [cards, setCards] = useState<any[]>([]);
  const [bankIdToName, setBankIdToName] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [displayCount, setDisplayCount] = useState(12);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [eligibilityOpen, setEligibilityOpen] = useState(false);
  const [eligibilitySubmitted, setEligibilitySubmitted] = useState(false);
  const [eligibleCardAliases, setEligibleCardAliases] = useState<string[]>([]);
  const [showGeniusDialog, setShowGeniusDialog] = useState(false);
  const [geniusSpendingData, setGeniusSpendingData] = useState<SpendingData | null>(null);
  const [cardSavings, setCardSavings] = useState<Record<string, Record<string, number>>>({});
  const [showStickyEligibility, setShowStickyEligibility] = useState(false);
  const [showStickyFilter, setShowStickyFilter] = useState(false);
  const lastScrollY = useRef(0);
  const heroRef = useRef<HTMLElement | null>(null);
  const eligibilityRef = useRef<HTMLDivElement | null>(null);
  const filtersRef = useRef<HTMLDivElement | null>(null);
  const cardsRef = useRef<HTMLDivElement | null>(null);

  // Comparison context (for mobile "View Compare" action)
  const { selectedCards } = useComparison();

  // Get category from URL params, default to "all"
  const initialCategory = normalizeCategory(searchParams.get('category'));

  // Filters - sort_by will be sent to API
  const [filters, setFilters] = useState({
    banks_ids: [] as number[],
    bank_names: [] as string[],
    card_networks: [] as string[],
    annualFees: "",
    credit_score: "",
    sort_by: "priority",
    // Empty string by default, can be "recommended", "annual_savings", or "annual_fees"
    free_cards: false,
    category: initialCategory // all, fuel, shopping, online-food, dining, grocery, travel, utility
  });

  // Category to slug mapping — values must match what the backend /cardgenius/cards API expects
  const categoryToSlug: Record<string, string> = {
    'all': '',
    'fuel': 'best-fuel-credit-card',
    'shopping': 'best-shopping-credit-card',
    'online-food': 'online-food-ordering',
    'dining': 'best-dining-credit-card',
    'grocery': 'best-cards-grocery-shopping',
    'travel': 'best-travel-credit-card',
    'utility': 'best-utility-credit-card'
  };

  /**
   * Eligibility form state.
   *
   * empStatus starts EMPTY, not "salaried". The previous default meant an
   * unresolved employment type was indistinguishable from a user who actually
   * selected "Salaried", which is exactly the silent-default failure that
   * produces a wrong card set looking like a correct one.
   */
  const [eligibility, setEligibility] = useState<{
    pincode: string;
    inhandIncome: string;
    empStatus: EmpStatus | "";
  }>({
    pincode: "",
    inhandIncome: "",
    empStatus: ""
  });
  const [hydration, setHydration] = useState<HydrationResult | null>(null);
  const [isRecheckingEligibility, setIsRecheckingEligibility] = useState(false);
  const hydratedOnce = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  useEffect(() => {
    fetchCards();
  }, [filters]);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  // Load the bank_id -> name map once. The /cardgenius/cards listing only
  // carries a numeric bank_id, so the Bank filter resolves names from the
  // init-bundle's bank_data.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const bundle = await cardService.getInitBundle();
        const banks = bundle?.data?.bank_data ?? bundle?.bank_data ?? [];
        if (cancelled || !Array.isArray(banks)) return;
        const map: Record<string, string> = {};
        for (const b of banks) {
          const name = (b?.name || '').trim();
          if (b?.id != null && name) map[String(b.id)] = name;
        }
        setBankIdToName(map);
      } catch {
        // Non-fatal: the Bank filter simply stays hidden if the map fails to load.
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Discover page view (fires once on mount)
  useEffect(() => {
    trackDiscoverPageView();
  }, []);

  // Listing view — fires when the card grid finishes loading
  useEffect(() => {
    if (!loading) {
      trackListingPageView(filteredCards.length, Math.min(displayCount, filteredCards.length));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  // Scroll listener for sticky elements
  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      const isScrollingUp = currentY < lastScrollY.current;
      lastScrollY.current = currentY;

      setShowStickyEligibility(isScrollingUp && currentY > 300 && !eligibilitySubmitted);
      setShowStickyFilter(currentY > 60);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [eligibilitySubmitted]);

  const scrollToSection = (ref: React.RefObject<HTMLElement | HTMLDivElement>) => {
    if (!ref.current) return;
    const offset = window.innerWidth < 1024 ? 70 : 0;
    const top = ref.current.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: 'smooth' });
  };

  const fetchCards = async () => {
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      setLoading(true);

      // Only slug and sort_by reach the network — this endpoint does not filter
      // by eligibility, bank, network or fee. Eligibility is applied
      // client-side in filteredCards, against the aliases from
      // checkEligibility. Filters are likewise applied client-side below.
      const response = await cardService.getCardListing(
        {
          slug: categoryToSlug[filters.category] ?? '',
          sort_by: filters.sort_by || "priority",
        },
        controller.signal
      );
      let incomingCards: any[] = [];
      if (response.status === 'success' && response.data && Array.isArray(response.data.cards)) {
        incomingCards = response.data.cards;
      } else if (response.data && Array.isArray(response.data)) {
        incomingCards = response.data;
      } else {
        console.error('Unexpected response format:', response);
        toast.error("Failed to load cards");
      }

      // Client-side safety filters (in case backend doesn't filter)
      // 1) Card Network
      if (Array.isArray(incomingCards) && filters.card_networks?.length) {
        const wanted = filters.card_networks.map(n => n.replace(/\s+/g, '').toLowerCase());
        incomingCards = incomingCards.filter((card: any) => {
          const typeStr = getCardNetworks(card).toString();
          const parts = typeStr.split(',').map((p: string) => p.replace(/\s+/g, '').toLowerCase());
          // Keep card if any selected network matches any part
          return wanted.some(w => parts.includes(w));
        });
      }

      // 2) Annual Fee range - Fix lifetime free filter
      if (Array.isArray(incomingCards) && filters.annualFees) {
        const val = filters.annualFees as string;

        // Special case for "free" - check both joining fee and annual fee
        if (val === 'free') {
          incomingCards = incomingCards.filter((card: any) => {
            const joiningFeeRaw = card.joining_fee_text ?? card.joining_fee ?? card.joiningFee ?? '0';
            const annualFeeRaw = card.annual_fee_text ?? card.annual_fee ?? card.annualFees ?? '0';
            const joiningFee = parseInt(joiningFeeRaw?.toString().replace(/[^0-9]/g, ''), 10);
            const annualFee = parseInt(annualFeeRaw?.toString().replace(/[^0-9]/g, ''), 10);
            const joiningFeeNum = Number.isFinite(joiningFee) ? joiningFee : 0;
            const annualFeeNum = Number.isFinite(annualFee) ? annualFee : 0;
            return joiningFeeNum === 0 && annualFeeNum === 0;
          });
        } else {
          // Handle range filters
          let min = 0;
          let max = Number.POSITIVE_INFINITY;
          if (val.includes('-')) {
            const [a, b] = val.split('-');
            min = parseInt(a, 10) || 0;
            const parsedMax = parseInt(b, 10);
            max = Number.isNaN(parsedMax) ? Number.POSITIVE_INFINITY : parsedMax;
          } else if (val.endsWith('+')) {
            min = parseInt(val, 10) || 0;
            max = Number.POSITIVE_INFINITY;
          }
          incomingCards = incomingCards.filter((card: any) => {
            const feeRaw = card.annual_fee_text ?? card.annual_fee ?? card.annualFees ?? '0';
            const fee = parseInt(feeRaw?.toString().replace(/[^0-9]/g, ''), 10);
            const feeNum = Number.isFinite(fee) ? fee : 0;
            return feeNum >= min && feeNum <= max;
          });
        }
      }

      // 3) Credit Score buckets (maximum score)
      if (Array.isArray(incomingCards) && filters.credit_score) {
        if (filters.credit_score.includes('-')) {
          // Handle range format like "0-600", "0-650", etc.
          const [minStr, maxStr] = filters.credit_score.split('-');
          const maxScore = parseInt(maxStr, 10) || Number.POSITIVE_INFINITY;
          incomingCards = incomingCards.filter((card: any) => {
            const scoreRaw = card.crif ?? card.credit_score ?? '';
            const score = parseInt(scoreRaw?.toString().replace(/[^0-9]/g, ''), 10);
            const scoreNum = Number.isFinite(score) ? score : 0;
            return scoreNum <= maxScore;
          });
        }
      }

      // 4) Sort by priority (always, regardless of category)
      // Lower priority number = higher priority (priority 1 comes before priority 66)
      if (Array.isArray(incomingCards)) {
        incomingCards.sort(compareCardsByPriority);
      }
      setCards(Array.isArray(incomingCards) ? [...incomingCards] : []);
    } catch (error: any) {
      if (error?.name === 'AbortError') {
        return;
      }
      console.error('Failed to fetch cards:', error);
      toast.error("Failed to load cards. Please try again.");
      setCards([]);
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  };
  const handleSearch = () => {
    // Search is handled on frontend only
    if (searchQuery) {
      analytics.trackSearch(searchQuery);
    }
    trackDiscoverSearchSubmitted(searchQuery);
    setDisplayCount(12);
  };

  const parsePriorityValue = (value: any): number => {
    if (value === null || value === undefined) return Number.POSITIVE_INFINITY;
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    const parsed = parseInt(String(value).replace(/[^0-9-]/g, ''), 10);
    return Number.isFinite(parsed) ? parsed : Number.POSITIVE_INFINITY;
  };

  const getPriorityValue = (card: any, category: string): number => {
    if (category && category !== 'all') {
      const categorySlug = categoryToSlug[category];
      const categoryPriority = card?.category_priority?.[categorySlug];
      if (categoryPriority !== undefined && categoryPriority !== null) {
        return parsePriorityValue(categoryPriority);
      }
    }
    return parsePriorityValue(card?.priority);
  };

  // Frontend search filter
  const compareCardsByPriority = (a: any, b: any) => {
    const aPriorityValue = getPriorityValue(a, filters.category);
    const bPriorityValue = getPriorityValue(b, filters.category);
    if (aPriorityValue !== bPriorityValue) {
      return aPriorityValue - bPriorityValue;
    }

    // Tie-breaker 1: Higher ratings first
    const aRating = parseFloat(a.rating) || 0;
    const bRating = parseFloat(b.rating) || 0;
    if (aRating !== bRating) {
      return bRating - aRating;
    }

    // Tie-breaker 2: alphabetical order
    return (a.name || '').localeCompare(b.name || '');
  };

  /**
   * A fully-resolved partner arrival is an eligibility-gated flow: the user came
   * from a partner link (or the entry form) that already carries sal/pin/st, and
   * must only ever see the cards they qualify for. Eligibility is therefore
   * locked — it cannot be cleared to reveal the full catalogue. The chip row
   * stays editable (a different salary re-runs eligibility), but there is no
   * "show all cards" escape in this flow. Defined here (ahead of filteredCards)
   * because that memo reads it.
   */
  const eligibilityLocked = Boolean(hydration?.resolved);

  const sortedCards = useMemo(() => {
    if (!Array.isArray(cards)) return [];
    return [...cards].sort(compareCardsByPriority);
  }, [cards, filters.category]);

  // Resolve a card's bank name from its numeric bank_id via the init-bundle map,
  // falling back to any embedded banks.name if the API shape ever changes.
  const getCardBankName = (card: any): string =>
    (bankIdToName[String(card?.bank_id)] || card?.banks?.name || '').trim();

  // Distinct bank names present in the current listing, for the Bank filter.
  const availableBanks = useMemo(() => {
    if (!Array.isArray(cards)) return [] as string[];
    const names = new Set<string>();
    for (const card of cards) {
      const name = getCardBankName(card);
      if (name) names.add(name);
    }
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [cards, bankIdToName]);

  const filteredCards = useMemo(() => {
    // 1) Apply search filter
    let base = sortedCards.filter(card => {
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      const cardName = (card.name || '').toLowerCase();
      const bankName = (card.banks?.name || '').toLowerCase();
      const cardType = (card.card_type || '').toLowerCase();
      const benefits = (card.benefits || '').toLowerCase();
      return cardName.includes(query) || bankName.includes(query) || cardType.includes(query) || benefits.includes(query);
    });

    // 1b) Apply bank filter (client-side, by bank name)
    if (filters.bank_names.length > 0) {
      const wanted = new Set(filters.bank_names.map(n => n.toLowerCase()));
      base = base.filter(card => wanted.has(getCardBankName(card).toLowerCase()));
    }

    // 2) Filter out cards with zero savings when a category is active and savings data is loaded
    if (filters.category !== 'all') {
      const categorySavings = cardSavings[filters.category];
      if (categorySavings && Object.keys(categorySavings).length > 0) {
        base = base.filter(card => {
          const cardKey = getCardKey(card);
          const saving = categorySavings[String(card.id)] ?? categorySavings[cardKey] ?? 0;
          return saving > 0;
        });
      }
    }

    // 3) Apply eligibility filter purely on frontend (seo_card_alias mapping).
    // In the locked partner flow the filter applies even when the eligible set
    // is empty, so zero eligible cards shows an empty state — never the full
    // catalogue. Outside that flow, an empty set falls back to showing all.
    if (eligibilitySubmitted && (eligibleCardAliases.length > 0 || eligibilityLocked)) {
      const eligibleSet = new Set(eligibleCardAliases.map(String));
      base = base.filter(card => {
        const alias = getCardAlias(card) || card.seo_card_alias || card.card_alias;
        return alias && eligibleSet.has(String(alias));
      });
    }

    return base;
  }, [sortedCards, searchQuery, eligibilitySubmitted, eligibleCardAliases, eligibilityLocked, filters.category, filters.bank_names, bankIdToName, cardSavings]);
  const loadMore = () => {
    trackListingLoadMoreClicked();
    setIsLoadingMore(true);
    setTimeout(() => {
      setDisplayCount(prev => prev + 12);
      setIsLoadingMore(false);
    }, 500);
  };
  const syncCategoryParam = (categoryValue: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (categoryValue === 'all') {
      params.delete('category');
    } else {
      params.set('category', categoryValue);
    }
    router.replace(`${pathname}?${params.toString()}`);
  };

  const handleFilterChange = (filterType: string, value: string | boolean) => {
    if (filterType === 'category' && typeof value === 'string') {
      const normalized = normalizeCategory(value);
      trackFilterCategorySelected(normalized);
      trackListingFiltersSelected('category', normalized);
      setFilters((prev: any) => ({
        ...prev,
        category: normalized
      }));
      syncCategoryParam(normalized);
      setDisplayCount(12);
      return;
    }

    analytics.trackFilterChange(filterType, String(value));
    if (filterType === 'annualFees') {
      trackFilterFeeRangeSelected(String(value));
    }
    trackListingFiltersSelected(filterType, String(value));

    setFilters((prev: any) => ({
      ...prev,
      [filterType]: value
    }));
  };

  useEffect(() => {
    const urlCategory = normalizeCategory(searchParams.get('category'));
    setFilters(prev => {
      if (prev.category === urlCategory) return prev; // no change
      return { ...prev, category: urlCategory };
    });
  }, [searchParams]);

  // Seed the search box from the ?q= param (e.g. searches coming from the homepage).
  useEffect(() => {
    const urlQuery = searchParams.get('q') || '';
    setSearchQuery(prev => (prev === urlQuery ? prev : urlQuery));
  }, [searchParams]);
  const clearFilters = () => {
    trackFiltersCleared();
    trackListingClearAllFilters();
    syncCategoryParam('all');
    setFilters({
      banks_ids: [],
      bank_names: [],
      card_networks: [],
      annualFees: "",
      credit_score: "",
      sort_by: "priority",
      free_cards: false,
      category: "all"
    });
    setSearchQuery("");
    setDisplayCount(12);

    // In the eligibility-gated partner flow, "Clear all" clears the other
    // filters but must NOT drop eligibility: the user may never see the full
    // catalogue here. Outside that flow it resets eligibility as before.
    if (!eligibilityLocked) {
      setEligibilitySubmitted(false);
      setEligibleCardAliases([]);
      setEligibility({
        pincode: "",
        inhandIncome: "",
        empStatus: "salaried"
      });
    }

    // Trigger API call (eligibility, if locked, is re-applied client-side).
    fetchCards();
  };
  /**
   * Run the eligibility check and apply the result.
   *
   * The one path used by the manual form, URL hydration and chip edits, so all
   * three produce identical wire payloads. Filtering is client-side: the
   * listing endpoint has no eligibility-filtered variant, so this is one POST
   * plus a re-filter, never a fresh listing fetch.
   */
  const runEligibility = async (
    basis: { pincode: string; inhandIncome: number; empStatus: EmpStatus },
    options: { announce?: boolean } = {}
  ): Promise<boolean> => {
    const { announce = true } = options;
    setIsRecheckingEligibility(true);

    try {
      const response = await cardService.checkEligibility({
        pincode: basis.pincode,
        // toBreIncome documents the unit: the API takes MONTHLY rupees, so this
        // is intentionally an identity mapping and must stay one.
        inhandIncome: toBreIncome(basis.inhandIncome),
        empStatus: basis.empStatus,
      });

      const aliases = extractEligibleAliases(response);

      setEligibleCardAliases(aliases);
      setEligibilitySubmitted(true);
      setEligibilityOpen(false);
      saveEligibility({
        pincode: basis.pincode,
        inhandIncome: basis.inhandIncome,
        empStatus: basis.empStatus,
      });

      trackEligibilityChecked(
        basis.pincode,
        String(basis.inhandIncome),
        basis.empStatus,
        aliases.length
      );

      if (aliases.length === 0) {
        toast.error("No Eligible Cards", {
          description: "No cards match your eligibility criteria"
        });
        return false;
      }

      if (announce) {
        const aliasSet = new Set(aliases);
        const totalInPage = (cards || []).length;
        const eligibleInPage = (cards || []).filter((card: any) => {
          const alias = getCardAlias(card) || card.seo_card_alias || card.card_alias;
          return alias && aliasSet.has(String(alias));
        }).length;
        const ineligibleInPage = totalInPage - eligibleInPage;

        toast.success("Eligibility criteria applied!", {
          description: `${ineligibleInPage} cards filtered out. Showing ${eligibleInPage} eligible cards.`
        });
        confetti({ particleCount: 60, spread: 50, origin: { y: 0.6 } });
      }

      analytics.trackEvent({ category: 'Engagement', action: 'Check Eligibility', label: 'Listing Page Success' });
      return true;
    } catch (error: any) {
      if (error?.name === 'AbortError') {
        toast.error("Eligibility check timed out. Please try again.");
      } else {
        console.error('Eligibility check error:', error);
        toast.error("We couldn't check eligibility right now. Please try again.");
      }
      return false;
    } finally {
      setIsRecheckingEligibility(false);
    }
  };

  const handleEligibilitySubmit = async () => {
    trackEligibilityCheckClicked();

    // Shared validators, identical to the ones the URL adapter uses.
    if (!isValidPincode(eligibility.pincode)) {
      toast.error("Please enter a valid 6-digit pincode");
      return;
    }
    const monthly = normalizeMonthlySalary(eligibility.inhandIncome);
    if (!monthly.ok) {
      toast.error("Please enter a valid monthly income");
      return;
    }
    if (!eligibility.empStatus) {
      toast.error("Please select your employment status");
      return;
    }

    trackEligibilityDetailsFilled(eligibility.pincode, String(monthly.value), eligibility.empStatus);
    await runEligibility({
      pincode: eligibility.pincode,
      inhandIncome: monthly.value,
      empStatus: eligibility.empStatus,
    });
  };

  /**
   * URL hydration for arrivals from Credit Links.
   *
   * Runs once. When all three of sal/pin/st resolve, the form is skipped and
   * the user lands straight on filtered results. When any one fails, the form
   * renders prefilled with whatever did resolve and focus goes to the first
   * unresolved field. A failed param is never defaulted.
   */
  useEffect(() => {
    if (hydratedOnce.current) return;
    hydratedOnce.current = true;

    const result = hydrateAndLog(searchParams);
    setHydration(result);
    // Attribution is stored regardless of whether eligibility resolved: p2/p3
    // must reach the outbound apply URL even for a user who fills the form.
    persistAttribution(result.attribution);

    const { pincode, inhandIncome, empStatus } = result.eligibility;
    if (pincode || inhandIncome || empStatus) {
      setEligibility({
        pincode: pincode ?? "",
        inhandIncome: inhandIncome ? String(inhandIncome) : "",
        empStatus: empStatus ?? "",
      });
    }

    if (result.resolved) {
      // announce:false — a hydrated user never asked for this, so the toast and
      // confetti would be an unexplained interruption on first paint.
      void runEligibility(
        { pincode: pincode!, inhandIncome: inhandIncome!, empStatus: empStatus! },
        { announce: false }
      );
    } else if (result.attempted) {
      // Open the mobile collapsible so the prefilled form is visible without a tap.
      setEligibilityOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  /** Focus the first field the partner link failed to resolve. */
  useEffect(() => {
    const field = hydration?.firstUnresolvedField;
    if (!field || hydration?.resolved || !hydration?.attempted) return;

    const baseId = FIELD_INPUT_IDS[field];
    const timer = setTimeout(() => {
      const preferMobile = window.innerWidth < 992;
      const candidates = preferMobile
        ? [baseId + MOBILE_ID_SUFFIX, baseId]
        : [baseId, baseId + MOBILE_ID_SUFFIX];
      for (const id of candidates) {
        const target = document.getElementById(id) as HTMLElement | null;
        if (target && target.offsetParent !== null) {
          target.focus();
          target.scrollIntoView({ block: 'center', behavior: 'smooth' });
          return;
        }
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [hydration]);

  /** Chip edit: re-run eligibility on the edited basis. */
  const handleBasisChange = async (next: EligibilityBasis) => {
    if (!next.pincode || !next.inhandIncome || !next.empStatus) return;

    setEligibility({
      pincode: next.pincode,
      inhandIncome: String(next.inhandIncome),
      empStatus: next.empStatus,
    });

    await runEligibility({
      pincode: next.pincode,
      inhandIncome: next.inhandIncome,
      empStatus: next.empStatus,
    });
  };

  const eligibilityBasis: EligibilityBasis = useMemo(() => {
    const monthly = normalizeMonthlySalary(eligibility.inhandIncome);
    return {
      pincode: eligibility.pincode || undefined,
      inhandIncome: monthly.ok ? monthly.value : undefined,
      empStatus: eligibility.empStatus || undefined,
    };
  }, [eligibility]);

  /** True when the user arrived with a complete, valid eligibility basis. */
  const skipForm = eligibilityLocked;

  const handleGeniusSubmit = async (spendingData: SpendingData) => {
    analytics.trackGeniusStart('Listing Genius - ' + filters.category);
    try {
      const currentCategory = filters.category;

      // Create fresh payload with ONLY the current category's spending data
      const freshPayload: SpendingData = {
        amazon_spends: 0,
        flipkart_spends: 0,
        other_online_spends: 0,
        other_offline_spends: 0,
        grocery_spends_online: 0,
        online_food_ordering: 0,
        fuel: 0,
        dining_or_going_out: 0,
        flights_annual: 0,
        hotels_annual: 0,
        domestic_lounge_usage_quarterly: 0,
        international_lounge_usage_quarterly: 0,
        mobile_phone_bills: 0,
        electricity_bills: 0,
        water_bills: 0,

        insurance_car_or_bike_annual: 0,
        rent: 0,
        school_fees: 0,
        ...spendingData // Only current category data will have non-zero values
      };
      setGeniusSpendingData(freshPayload);
      toast.success("Calculating savings...", {
        description: "Finding the best cards for your spending pattern"
      });
      const response = await cardService.calculateCardGenius(freshPayload);
      if (response.status === 'success' && response.data) {
        const savings: Record<string, number> = {};

        // Prefer explicit savings array
        let items: any[] = [];
        if (Array.isArray(response.data?.savings)) {
          items = response.data.savings;
        } else if (Array.isArray(response.data)) {
          items = response.data;
        } else if (Array.isArray(response.data?.cards)) {
          items = response.data.cards;
        } else if (typeof response.data === 'object') {
          // Some APIs return shape objects; flatten arrays only
          items = Object.values(response.data).flat().filter((v: any) => Array.isArray(v)).flat();
        }
        items.forEach((item: any) => {
          const valueRaw = item.total_savings_yearly ?? item.total_savings ?? item.net_savings ?? item.annual_savings ?? item.savings ?? 0;
          const value = Number(valueRaw);
          // Allow 0 savings - only skip if NaN or not a finite number
          if (Number.isNaN(value) || !Number.isFinite(value)) return;
          const id = item.card_id ?? item.cardId ?? item.id ?? item.card?.id;
          const alias = getCardAlias(item);
          if (id != null) {
            const prev = savings[String(id)];
            savings[String(id)] = typeof prev === 'number' ? Math.max(prev, value) : value;
          }
          if (alias) {
            const key = String(alias);
            const prev = savings[key];
            savings[key] = typeof prev === 'number' ? Math.max(prev, value) : value;
          }
        });

        // Store savings under current category, overwriting previous values
        setCardSavings(prev => ({
          ...prev,
          [currentCategory]: savings
        }));
        toast.success("Savings calculated!", {
          description: `Found savings for ${Object.keys(savings).length} cards`
        });
        confetti({
          particleCount: 100,
          spread: 70,
          origin: {
            y: 0.6
          }
        });
      }
    } catch (error) {
      console.error('Failed to calculate genius:', error);
      toast.error("Failed to calculate savings. Please try again.");
    }
  };
  const handleApplyClick = (card: any) => {
    analytics.trackCardAction('Apply Now', card.name);
    trackListingApplyNowClicked(getCardAlias(card) || card.seo_card_alias || card.card_alias, 'listing');
    // Apply is never gated on an eligibility check: the user goes straight to
    // the bank's application. Eligibility remains available as its own
    // deliberate action, but it no longer blocks the primary CTA.
    redirectToCardApplication(card);
  };

  // Filter sidebar component
  const FilterSidebar = () => <div className="space-y-3">
    {/* Category Filter - Open by default */}
    <Collapsible defaultOpen={true}>
      <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-2 hover:bg-muted/30 rounded-lg transition-colors text-left font-semibold touch-target">
        <h3 className="font-semibold">Category</h3>
        <ChevronDown className="w-4 h-4 transition-transform ui-expanded:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-2 space-y-2 pl-1">
        {[{
          id: 'all',
          label: 'All Cards',
          icon: CreditCard
        }, {
          id: 'fuel',
          label: 'Fuel',
          icon: Fuel
        }, {
          id: 'shopping',
          label: 'Shopping',
          icon: ShoppingBag
        }, {
          id: 'online-food',
          label: 'Food Delivery',
          icon: ShoppingCart
        }, {
          id: 'dining',
          label: 'Dining',
          icon: Utensils
        }, {
          id: 'grocery',
          label: 'Grocery',
          icon: Coffee
        }, {
          id: 'travel',
          label: 'Travel',
          icon: Plane
        }].map(cat => <label key={cat.id} className="filter-option flex items-center gap-3 cursor-pointer px-3 py-3 transition-all touch-target">
          <input type="radio" name="category" className="accent-primary w-5 h-5" checked={filters.category === cat.id} onChange={() => handleFilterChange('category', cat.id)} />
          <cat.icon className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm flex-1">{cat.label}</span>
        </label>)}
      </CollapsibleContent>
    </Collapsible>

    {/* Annual Fee Range - Collapsed by default */}
    <Collapsible defaultOpen={false}>
      <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-2 hover:bg-muted/30 rounded-lg transition-colors touch-target">
        <h3 className="font-semibold">Annual Fee Range</h3>
        <ChevronDown className="w-4 h-4 transition-transform ui-expanded:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-2 space-y-2 pl-1">
        {[{
          label: 'All Fees',
          value: ''
        }, {
          label: 'Lifetime Free (₹0)',
          value: 'free'
        }, {
          label: '₹1 - ₹1,000',
          value: '1-1000'
        }, {
          label: '₹1,001 - ₹2,000',
          value: '1001-2000'
        }, {
          label: '₹2,001 - ₹5,000',
          value: '2001-5000'
        }, {
          label: '₹5,001+',
          value: '5001+'
        }].map(fee => <label key={fee.value} className="filter-option flex items-center gap-3 cursor-pointer px-3 py-3 transition-all touch-target">
          <input type="radio" name="annualFee" className="accent-primary w-5 h-5" checked={filters.annualFees === fee.value} onChange={() => handleFilterChange('annualFees', fee.value)} />
          <span className="text-sm">{fee.label}</span>
        </label>)}
      </CollapsibleContent>
    </Collapsible>

    {/* Credit Score - Collapsed by default - COMMENTED OUT */}
    {/* <Collapsible defaultOpen={false}>
        <CollapsibleTrigger className="flex items-center justify-between w-full p-3 hover:bg-muted/50 rounded-lg transition-colors">
          <h3 className="font-semibold">Credit Score</h3>
          <ChevronDown className="w-4 h-4 transition-transform ui-expanded:rotate-180" />
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-3 space-y-2">
          {[
            { label: 'All Scores', value: '' },
            { label: 'Below 600', value: '0-600' },
            { label: 'Upto 650', value: '0-650' },
            { label: 'Upto 750', value: '0-750' },
            { label: 'Upto 800', value: '0-800' }
          ].map((score) => (
            <label key={score.value} className="flex items-center gap-2 cursor-pointer">
              <input 
                type="radio" 
                name="creditScore" 
                className="accent-primary"
                checked={filters.credit_score === score.value}
                onChange={() => handleFilterChange('credit_score', score.value)}
              />
              <span className="text-sm">{score.label}</span>
            </label>
          ))}
        </CollapsibleContent>
       </Collapsible> */}

    {/* Bank - Collapsed by default. Options are derived from the loaded cards. */}
    {availableBanks.length > 0 && (
    <Collapsible defaultOpen={false}>
      <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-2 hover:bg-muted/30 rounded-lg transition-colors text-left font-semibold touch-target">
        <h3 className="font-semibold">Bank</h3>
        <ChevronDown className="w-4 h-4 transition-transform ui-expanded:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-2 space-y-2 pl-1 max-h-72 overflow-y-auto">
        {availableBanks.map(bank => <label key={bank} className="filter-option flex items-center gap-3 cursor-pointer px-3 py-3 transition-all touch-target">
          <input type="checkbox" className="accent-primary w-5 h-5" checked={filters.bank_names.includes(bank)} onChange={e => {
            if (e.target.checked) {
              trackListingFiltersSelected('bank', bank);
            }
            setFilters((prev: any) => ({
              ...prev,
              bank_names: e.target.checked ? [...prev.bank_names, bank] : prev.bank_names.filter((b: string) => b !== bank)
            }));
            setDisplayCount(12);
          }} />
          <span className="text-sm flex-1">{bank}</span>
        </label>)}
      </CollapsibleContent>
    </Collapsible>
    )}

    {/* Card Network - Collapsed by default */}
    <Collapsible defaultOpen={false}>
      <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-2 hover:bg-muted/30 rounded-lg transition-colors text-left font-semibold touch-target">
        <h3 className="font-semibold">Card Network</h3>
        <ChevronDown className="w-4 h-4 transition-transform ui-expanded:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-2 space-y-2 pl-1">
        {['VISA', 'Mastercard', 'RuPay', 'AmericanExpress'].map(network => <label key={network} className="filter-option flex items-center gap-3 cursor-pointer px-3 py-3 transition-all touch-target">
          <input type="checkbox" className="accent-primary w-5 h-5" checked={filters.card_networks.includes(network)} onChange={e => {
            if (e.target.checked) {
              trackFilterNetworkSelected(network);
              trackListingFiltersSelected('network', network);
            }
            setFilters((prev: any) => ({
              ...prev,
              card_networks: e.target.checked ? [...prev.card_networks, network] : prev.card_networks.filter((n: string) => n !== network)
            }));
          }} />
          <span className="text-sm">{network === 'AmericanExpress' ? 'American Express' : network}</span>
        </label>)}
      </CollapsibleContent>
    </Collapsible>

  </div>;
  return <div className="min-h-screen bg-background">
    <Navigation />

    {/* Hero Search */}
    <section ref={heroRef} className="hero-card-listing pt-24 sm:pt-28 pb-8 sm:pb-12 bg-gradient-to-b from-background to-surface-elevated">
      <div className="section-shell">
        {/* Mobile & Desktop unified layout */}
        <div className="max-w-3xl mx-auto text-center mb-6 sm:mb-8 space-y-2 sm:space-y-3 px-4 hero-card-listing-header">
          <h1 className="hero-card-listing-title text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground leading-tight">
            Discover India's Best Credit&nbsp;Cards
          </h1>
        </div>

        <div className="max-w-2xl mx-auto px-4 sm:px-0 hero-card-listing-body">
          <div className="hero-card-listing-actions flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 sm:w-5 sm:h-5" />
              <Input
                type="text"
                placeholder="Search by card name..."
                value={searchQuery}
                onFocus={() => trackDiscoverSearchBarFocused()}
                onChange={e => { setSearchQuery(e.target.value); trackDiscoverSearchQueryTyped(e.target.value); }}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                className="hero-card-listing-input pl-10 sm:pl-12 pr-10 sm:pr-12 h-12 sm:h-14 text-sm sm:text-base md:text-lg rounded-xl touch-target"
              />
              {searchQuery && (
                <button onClick={() => {
                  setSearchQuery("");
                  handleSearch();
                }} className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground touch-target p-1">
                  <X className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              )}
            </div>
            <Button
              size="lg"
              className="hero-card-listing-search-btn h-12 sm:h-14 w-full sm:w-auto px-6 sm:px-8 touch-target"
              onClick={handleSearch}
            >
              <span className="hidden xs:inline">Search</span>
              <Search className="w-4 h-4 xs:hidden" />
            </Button>
          </div>
        </div>
      </div>
    </section>


    {/* Main Content */}
    <section className="flex-1 overflow-hidden">
      <div className="section-shell h-full flex flex-col">
        <div className="flex flex-col lg:flex-row gap-8 h-full overflow-visible py-6">
          {/* Desktop Filters Sidebar */}
          <aside className="hidden lg:block w-72 flex-shrink-0 overflow-y-auto">
            <div className="bg-card rounded-2xl shadow-lg p-6 sticky top-28">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Filters</h2>
                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs">
                  Clear All
                </Button>
              </div>
              <FilterSidebar />
            </div>
          </aside>

          {/* Card Grid */}
          <div className="flex-1 flex flex-col overflow-visible">
            {/* Eligibility Section - Collapsible on Mobile, Always Visible on Desktop */}
            {/*
              A fully-resolved partner link skips the form entirely. Anything
              less renders it prefilled, so the form is never bypassed without
              a complete, valid eligibility basis.
            */}
            {skipForm ? (
              <EligibilityChips
                basis={eligibilityBasis}
                onChange={handleBasisChange}
                isUpdating={isRecheckingEligibility}
              />
            ) : (
            <div ref={eligibilityRef} className="mb-4 sm:mb-6">
              {/* Mobile: Collapsible */}
              <div className="lg:hidden">
                <Collapsible open={eligibilityOpen} onOpenChange={setEligibilityOpen}>
                  <div className="bg-surface-elevated rounded-xl border border-border overflow-hidden">
                    <CollapsibleTrigger className="w-full p-3 sm:p-4 flex items-center justify-between hover:bg-accent transition-colors touch-target">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-accent-text flex-shrink-0" />
                        <div className="text-left">
                          <h3 className="font-semibold text-xs sm:text-sm text-foreground">Check Eligibility</h3>
                          <p className="text-[10px] sm:text-xs text-muted-foreground">Quick 3-field check</p>
                        </div>
                      </div>
                      <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground transition-transform ui-state-open:rotate-180" />
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <div className="p-3 sm:p-4 pt-0">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 items-end">
                          <div>
                            <Input
                              id={FIELD_INPUT_IDS.pincode + MOBILE_ID_SUFFIX}
                              type="text"
                              inputMode="numeric"
                              placeholder="Pincode"
                              maxLength={6}
                              value={eligibility.pincode}
                              onChange={e => setEligibility(prev => ({
                                ...prev,
                                pincode: e.target.value.replace(/\D/g, '')
                              }))}
                              className="h-11 text-sm rounded-lg bg-background"
                            />
                          </div>
                          <div>
                            <Input
                              id={FIELD_INPUT_IDS.inhandIncome + MOBILE_ID_SUFFIX}
                              type="number"
                              placeholder="Monthly Income"
                              value={eligibility.inhandIncome}
                              onChange={e => setEligibility(prev => ({
                                ...prev,
                                inhandIncome: e.target.value
                              }))}
                              className="h-11 text-sm rounded-lg bg-background"
                            />
                          </div>
                          <div>
                            <Select value={eligibility.empStatus} onValueChange={value => setEligibility(prev => ({
                              ...prev,
                              empStatus: value as EmpStatus
                            }))}>
                              <SelectTrigger id={FIELD_INPUT_IDS.empStatus + MOBILE_ID_SUFFIX} className="h-11 text-sm rounded-lg bg-background">
                                <SelectValue placeholder="Employment" />
                              </SelectTrigger>
                              <SelectContent className="bg-card z-50">
                                {EMP_STATUS_OPTIONS.map(option => (
                                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <Button
                            onClick={handleEligibilitySubmit}
                            size="lg"
                            className="h-11 gap-2 w-full bg-primary hover:bg-primary-hover"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span className="text-sm font-semibold">{eligibilitySubmitted ? "Applied" : "Check"}</span>
                          </Button>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              </div>

              {/* Desktop: Always Visible */}
              <div className="hidden lg:block bg-card rounded-2xl shadow-lg border border-border/50 p-6">
                <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 items-end">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Pincode</label>
                    <Input
                      id={FIELD_INPUT_IDS.pincode}
                      type="text"
                      inputMode="numeric"
                      placeholder="Enter 6-digit pincode"
                      maxLength={6}
                      value={eligibility.pincode}
                      onChange={e => setEligibility(prev => ({
                        ...prev,
                        pincode: e.target.value.replace(/\D/g, '')
                      }))}
                      className="h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Monthly Income (₹)</label>
                    <Input
                      id={FIELD_INPUT_IDS.inhandIncome}
                      type="number"
                      placeholder="e.g., 50000"
                      value={eligibility.inhandIncome}
                      onChange={e => setEligibility(prev => ({
                        ...prev,
                        inhandIncome: e.target.value
                      }))}
                      className="h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Employment Status</label>
                    <Select value={eligibility.empStatus} onValueChange={value => setEligibility(prev => ({
                      ...prev,
                      empStatus: value as EmpStatus
                    }))}>
                      <SelectTrigger id={FIELD_INPUT_IDS.empStatus} className="h-12">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card z-50">
                        {EMP_STATUS_OPTIONS.map(option => (
                          <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    onClick={handleEligibilitySubmit}
                    size="lg"
                    className="h-12 gap-2"
                    variant={eligibilitySubmitted ? "default" : "default"}
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    {eligibilitySubmitted ? "Eligibility Applied" : "Check Eligibility"}
                  </Button>
                </div>
              </div>
            </div>
            )}

            {/*
              Chips also show after a manual submit, so a user who filled the
              form can see and edit the basis their results are built on.
            */}
            {!skipForm && eligibilitySubmitted && (
              <EligibilityChips
                basis={eligibilityBasis}
                onChange={handleBasisChange}
                isUpdating={isRecheckingEligibility}
              />
            )}

            {/* AI Card Genius Promo - Desktop Only */}
            {filters.category !== 'all' && (() => {
              const categoryLabels: Record<string, string> = {
                'fuel': 'Fuel',
                'shopping': 'Shopping',
                'online-food': 'Food Delivery',
                'dining': 'Dining',
                'grocery': 'Grocery',
                'travel': 'Travel',
                'utility': 'Utility'
              };
              const categoryName = categoryLabels[filters.category] || 'Category';
              return <div className="hidden lg:block mb-4 bg-surface-elevated border border-border rounded-xl p-3">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 flex-1">
                    <Sparkles className="h-4 w-4 text-accent-text flex-shrink-0" />
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">
                        Pro Tip: Try our AI Card Genius
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Exploring {categoryName} cards? See your yearly savings instantly.
                      </p>
                    </div>
                  </div>
                  <Button onClick={() => setShowGeniusDialog(true)} size="sm" className="whitespace-nowrap bg-primary hover:bg-primary-hover text-primary-foreground h-9 px-4">
                    Enter My Spends
                  </Button>
                </div>
              </div>;
            })()}

            {/* Desktop Filter Info */}
            <div className="hidden lg:flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">
                Showing {Math.min(displayCount, filteredCards.length)} of {filteredCards.length} cards
              </p>
            </div>

            {/* Mobile Filter Info Bar - Just show count */}
            <div ref={filtersRef} className="lg:hidden mb-3">
              <div className="flex items-center justify-between px-1">
                <p className="text-xs sm:text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">{filteredCards.length}</span> cards found
                </p>
                {(filters.category !== 'all' || filters.bank_names.length > 0 || filters.card_networks.length > 0 || filters.annualFees || eligibilitySubmitted) && (
                  <button
                    onClick={clearFilters}
                    className="text-xs text-accent-text hover:text-primary-hover font-semibold"
                  >
                    Clear all
                  </button>
                )}
              </div>

              {/* Hidden sheet trigger for programmatic open */}
              <Sheet>
                <SheetTrigger asChild>
                  <button id="mobile-filter-trigger" className="hidden"></button>
                </SheetTrigger>
                <SheetContent side="bottom" className="h-[70vh] rounded-t-3xl px-0">
                  <div className="drag-handle" />
                  <SheetHeader className="text-left mb-4 px-4">
                    <div className="flex items-center justify-between">
                      <SheetTitle className="text-lg font-bold">Filters</SheetTitle>
                      <span className="text-xs text-muted-foreground">{filteredCards.length} cards</span>
                    </div>
                  </SheetHeader>
                  <div className="overflow-y-auto h-[calc(70vh-140px)] px-4 space-y-5 pb-24">
                    <FilterSidebar />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-background border-t border-border p-4 shadow-lg">
                    <div className="flex gap-3">
                      <SheetClose asChild>
                        <Button variant="outline" className="flex-1 h-11 text-sm font-semibold" onClick={clearFilters}>
                          Clear
                        </Button>
                      </SheetClose>
                      <SheetClose asChild>
                        <Button className="flex-1 h-11 text-sm font-bold">
                          Show {filteredCards.length} Cards
                        </Button>
                      </SheetClose>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            {/* Active Filters */}
            {(filters.category !== 'all' || filters.bank_names.length > 0 || filters.card_networks.length > 0 || filters.free_cards || filters.annualFees || filters.credit_score || eligibilitySubmitted || geniusSpendingData || searchQuery) && <div className="mb-4 flex flex-wrap gap-2">
              {searchQuery && <Badge variant="secondary" className="gap-2">
                Search: {searchQuery}
                <X className="w-3 h-3 cursor-pointer" onClick={() => {
                  setSearchQuery("");
                  handleSearch();
                }} />
              </Badge>}
              {filters.category !== 'all' && <Badge variant="secondary" className="gap-2">
                Category: {(() => {
                  const categoryLabels: Record<string, string> = {
                    'fuel': 'Fuel',
                    'shopping': 'Shopping',
                    'online-food': 'Food Delivery',
                    'dining': 'Dining',
                    'grocery': 'Grocery',
                    'travel': 'Travel',
                    'utility': 'Utility'
                  };
                  return categoryLabels[filters.category] || filters.category;
                })()}
                <X className="w-3 h-3 cursor-pointer" onClick={() => handleFilterChange('category', 'all')} />
              </Badge>}
              {filters.bank_names.map(bank => (
                <Badge key={bank} variant="secondary" className="gap-2">
                  {bank}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => {
                    setFilters(prev => ({
                      ...prev,
                      bank_names: prev.bank_names.filter(b => b !== bank)
                    }));
                  }} />
                </Badge>
              ))}
              {filters.card_networks.map(network => (
                <Badge key={network} variant="secondary" className="gap-2">
                  {network === 'AmericanExpress' ? 'American Express' : network}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => {
                    setFilters(prev => ({
                      ...prev,
                      card_networks: prev.card_networks.filter(n => n !== network)
                    }));
                  }} />
                </Badge>
              ))}
              {filters.free_cards && <Badge variant="secondary" className="gap-2">
                Lifetime Free
                <X className="w-3 h-3 cursor-pointer" onClick={() => handleFilterChange('free_cards', false)} />
              </Badge>}
              {filters.annualFees && !filters.free_cards && <Badge variant="secondary" className="gap-2">
                Fee: ₹{filters.annualFees}
                <X className="w-3 h-3 cursor-pointer" onClick={() => handleFilterChange('annualFees', '')} />
              </Badge>}
              {filters.credit_score && <Badge variant="secondary" className="gap-2">
                Credit Score: {filters.credit_score}
                <X className="w-3 h-3 cursor-pointer" onClick={() => handleFilterChange('credit_score', '')} />
              </Badge>}
              {eligibilitySubmitted && <Badge variant="secondary" className="gap-2 bg-surface-elevated text-accent-text border-border">
                <CheckCircle2 className="w-3 h-3" />
                Eligibility Applied
                {/* Locked in the partner flow: no removing eligibility to reveal all cards. */}
                {!eligibilityLocked && <X className="w-3 h-3 cursor-pointer" onClick={async () => {
                  setEligibilitySubmitted(false);
                  setEligibility({
                    pincode: "",
                    inhandIncome: "",
                    empStatus: "salaried"
                  });
                  await fetchCards();
                  toast.success("Eligibility filter removed");
                }} />}
              </Badge>}
              {geniusSpendingData && <Badge variant="secondary" className="gap-2 bg-surface-elevated text-accent-text border-border">
                <Sparkles className="w-3 h-3" />
                Category Genius Applied
                <X className="w-3 h-3 cursor-pointer" onClick={() => {
                  setGeniusSpendingData(null);
                  setCardSavings({});
                  toast.success("Category genius filter removed");
                }} />
              </Badge>}
            </div>}

            {/* Cards Grid - Scrollable */}
            <div ref={cardsRef} className="flex-1 overflow-y-auto px-1">
              {loading ? <div className="text-center py-16">
                <div className="inline-block w-10 h-10 sm:w-12 sm:h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-4 sm:mt-6 text-sm sm:text-base text-muted-foreground">Loading your perfect cards...</p>
              </div> : filteredCards.length === 0 ? <div className="text-center py-16 px-4">
                <p className="text-lg sm:text-xl text-muted-foreground mb-4">No cards found matching your criteria</p>
                <Button variant="outline" className="mt-4 touch-target" onClick={clearFilters}>
                  Clear All Filters
                </Button>
              </div> : <>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5 md:gap-6 pb-6">
                  {filteredCards.slice(0, displayCount).map((card, index) => <div key={card.id || index} onClick={() => trackCardClicked(getCardAlias(card) || card.seo_card_alias || card.card_alias, card.name, card.banks?.name, index)} className="card-item bg-card rounded-xl sm:rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all hover:scale-[1.02] lg:hover:-translate-y-2 flex flex-col h-full active:scale-[0.98]">
                    <div className="card-image-container relative aspect-[5/4] w-full bg-gradient-to-br from-surface-elevated to-muted/40 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {/* Compare Toggle Icon - Top Right */}
                      <div className="absolute top-3 right-3 z-20">
                        <CompareToggleIcon card={card} />
                      </div>

                      {/* Savings Badge */}
                      {filters.category !== 'all' && (() => {
                        const categorySavings = cardSavings[filters.category] || {};
                        const cardKey = getCardKey(card);
                        const saving = categorySavings[String(card.id)] ?? categorySavings[cardKey] ?? 0;
                        if (saving === 0) {
                          return <div className="absolute top-3 left-3 bg-gradient-to-r from-gray-500 to-gray-600 text-primary-foreground px-3 py-1.5 rounded-lg shadow-lg flex items-center gap-1.5 text-sm font-bold z-10">
                            <Sparkles className="w-4 h-4" />
                            ₹0 Savings/yr
                          </div>;
                        }
                        return <div className="absolute top-3 left-3 bg-primary text-primary-foreground px-3 py-1.5 rounded-lg shadow-lg flex items-center gap-1.5 text-sm font-bold z-10">
                          <Sparkles className="w-4 h-4" />
                          Save ₹{saving.toLocaleString()}/yr
                        </div>;
                      })()}

                      {/* Eligibility Badge - Only show for cards that are actually eligible (and not already showing savings or LTF) */}
                      {eligibilitySubmitted && eligibleCardAliases.length > 0 && !(() => {
                        const categorySavings = cardSavings[filters.category] || {};
                        const cardKey = getCardKey(card);
                        const saving = categorySavings[String(card.id)] ?? categorySavings[cardKey];
                        return saving !== undefined && saving !== null;
                      })() && !((card.joining_fee_text === "0" || card.joining_fee_text?.toLowerCase?.() === "free") && (card.annual_fee_text === "0" || card.annual_fee_text?.toLowerCase?.() === "free")) && (() => {
                        const alias = getCardAlias(card) || card.seo_card_alias || card.card_alias;
                        return alias && eligibleCardAliases.includes(String(alias));
                      })() && (
                          <Badge className="absolute bottom-3 right-3 bg-primary gap-1 z-10">
                            <CheckCircle2 className="w-3 h-3" />
                            Eligible
                          </Badge>
                        )}

                      {/* Status Badges (Discontinued / Invite Only / LTF) */}
                      {(() => {
                        const status = getCardStatus(card);
                        if (status === 'discontinued') {
                          return (
                            <span className="absolute bottom-3 right-3 z-10 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold tracking-wide bg-primary text-primary-foreground shadow-md border border-primary backdrop-blur-sm">
                              <span className="w-1.5 h-1.5 rounded-full bg-primary-glow inline-block" />
                              Discontinued
                            </span>
                          );
                        }
                        if (status === 'invite_only') {
                          return (
                            <span className="absolute bottom-3 right-3 z-10 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold tracking-wide bg-primary text-primary-foreground shadow-md backdrop-blur-sm">
                              <span className="w-1.5 h-1.5 rounded-full bg-card inline-block" />
                              Invite Only
                            </span>
                          );
                        }
                        if (status === 'lifetime_free') {
                          const categorySavings = cardSavings[filters.category] || {};
                          const cardKey = getCardKey(card);
                          const saving = categorySavings[String(card.id)] ?? categorySavings[cardKey];
                          return !saving && (
                            <span className="absolute bottom-3 right-3 z-10 inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold tracking-wide bg-surface-elevated text-accent-text shadow-md">
                              LTF
                            </span>
                          );
                        }
                        return null;
                      })()}

                      <img src={card.card_bg_image || card.image || '/placeholder.svg'} alt={card.name} loading="lazy" className="w-full h-full object-contain" onError={e => {
                        e.currentTarget.src = '/placeholder.svg';
                      }} />
                    </div>

                    <div className="p-5 sm:p-6 flex flex-col flex-grow gap-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        {getCardNetworks(card)
                          ? getCardNetworks(card).split(',').map((n: string) => n.trim()).filter(Boolean).map((network: string) => (
                              <Badge key={network} variant="outline" className="text-xs">
                                {network === 'AmericanExpress' ? 'Amex' : network}
                              </Badge>
                            ))
                          : <Badge variant="outline" className="text-xs">Credit Card</Badge>
                        }
                        {card.banks?.name && (
                          <span className="text-xs text-muted-foreground">
                            {card.banks.name}
                          </span>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <h3 className="text-lg sm:text-xl font-bold leading-snug line-clamp-2">{card.name}</h3>
                        {(card.reward_rate || card.welcome_bonus) && <p className="text-xs text-muted-foreground line-clamp-2 md:hidden">
                          {card.reward_rate || card.welcome_bonus}
                        </p>}
                      </div>

                      <div className="grid grid-cols-2 gap-3 md:gap-4 p-3 md:p-4 bg-muted/30 rounded-lg">
                        <div className="flex flex-col relative group cursor-default">
                          <p className="text-[11px] text-muted-foreground mb-1">Joining</p>
                          <p className="font-semibold">{feeCalc(card.joining_fee_text).display}</p>
                          {feeCalc(card.joining_fee_text).tooltip && (
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-50 bg-card text-primary-foreground text-xs rounded px-2 py-1 whitespace-nowrap shadow-lg pointer-events-none">
                              {feeCalc(card.joining_fee_text).tooltip}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col relative group cursor-default">
                          <p className="text-[11px] text-muted-foreground mb-1">Annual</p>
                          <p className="font-semibold">{feeCalc(card.annual_fee_text).display}</p>
                          {feeCalc(card.annual_fee_text).tooltip && (
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-50 bg-card text-primary-foreground text-xs rounded px-2 py-1 whitespace-nowrap shadow-lg pointer-events-none">
                              {feeCalc(card.annual_fee_text).tooltip}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col md:flex-row gap-2 mt-auto">
                        <Link
                          to={`/cards/${getCardAlias(card) || card.id}`}
                          className={canApply(card) ? "flex-1 md:w-1/2 w-full" : "w-full"}
                          onClick={() => { analytics.trackCardAction('View Details', card.name); trackCardDetailsClicked(getCardAlias(card) || card.seo_card_alias || card.card_alias, card.name, index); }}
                        >
                          <Button variant="outline" className="w-full h-11 md:h-10 text-sm font-semibold">
                            {canApply(card) ? 'Details' : 'View Details'}
                          </Button>
                        </Link>
                        {canApply(card) && (
                          <Button className="flex-1 h-11 md:h-10 text-sm md:w-1/2 w-full font-semibold" onClick={() => handleApplyClick(card)}>
                            Apply&nbsp;Now
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>)}
                </div>

                {/* Load More Button */}
                {displayCount < filteredCards.length && <div className="text-center mt-6 sm:mt-8 px-4 sm:px-0">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto sm:min-w-[280px] touch-target h-12 sm:h-14 font-semibold"
                    variant="outline"
                    onClick={loadMore}
                    disabled={isLoadingMore}
                  >
                    {isLoadingMore ? <>
                      <div className="inline-block w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2"></div>
                      <span className="text-sm sm:text-base">Loading...</span>
                    </> : <>
                      <span className="text-sm sm:text-base">Load More Cards</span>
                      <span className="ml-2 text-xs sm:text-sm opacity-70">({filteredCards.length - displayCount} remaining)</span>
                    </>}
                  </Button>
                </div>}
              </>}
            </div>
          </div>
        </div>
      </div>
    </section>

    {/* Sticky Eligibility Bar (Top) - Shows on scroll */}
    {showStickyEligibility && !eligibilitySubmitted && (
      <div className="lg:hidden fixed top-14 left-0 right-0 z-40 bg-card border-b border-border shadow-md animate-in slide-in-from-top duration-300">
        <div className="px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-accent-text" />
            <span className="text-xs font-semibold">Check Eligibility</span>
          </div>
          <Button
            size="sm"
            onClick={() => {
              setEligibilityOpen(true);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="h-8 text-xs font-bold bg-primary hover:bg-primary-hover"
          >
            Quick Check
          </Button>
        </div>
      </div>
    )}

    {/* Floating Try Genius Widget (Bottom-Right) - Shows when category selected */}
    {filters.category !== 'all' && !showGeniusDialog && (
      <button
        onClick={() => setShowGeniusDialog(true)}
        className="lg:hidden fixed bottom-20 right-4 z-50 bg-primary hover:bg-primary-hover text-primary-foreground rounded-full shadow-2xl hover:shadow-glow p-3 sm:p-4 flex items-center gap-2 animate-in zoom-in duration-300 touch-target group active:scale-95 transition-all"
        style={{ bottom: showStickyFilter ? '80px' : '20px' }}
      >
        <div className="relative">
          <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
        </div>
        <span className="font-bold text-sm whitespace-nowrap">Try Genius</span>
      </button>
    )}

    {/* Sticky Filter Button (Bottom) - Shows on scroll */}
    {showStickyFilter && (
      <div className="lg:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-40 animate-in slide-in-from-bottom duration-300 px-4 w-full">
        <div className="bg-card/95 backdrop-blur-md border border-primary/40 rounded-full shadow-2xl px-4 py-2 flex items-center justify-center gap-3">
          {/* Filters trigger */}
          <button
            onClick={() => document.getElementById('mobile-filter-trigger')?.click()}
            className="flex items-center gap-2 text-foreground text-xs font-semibold"
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
            {(filters.category !== 'all' || filters.card_networks.length > 0 || filters.annualFees || eligibilitySubmitted) && (
              <span className="ml-1 px-2 py-0.5 bg-surface-elevated text-foreground text-[10px] rounded-full font-bold">
                {[filters.category !== 'all', filters.card_networks.length > 0, filters.annualFees, eligibilitySubmitted].filter(Boolean).length}
              </span>
            )}
          </button>

          {/* Divider */}
          {selectedCards.length > 0 && (
            <>
              <span className="h-5 w-px bg-border" />
              <button
                onClick={() => window.dispatchEvent(new Event('openComparison'))}
                className="text-accent-text font-semibold text-xs"
              >
                View Compare
              </button>
            </>
          )}
        </div>
      </div>
    )}

    {/* Genius Dialog */}
    <GeniusDialog open={showGeniusDialog} onOpenChange={setShowGeniusDialog} category={filters.category} onSubmit={handleGeniusSubmit} />

{/* Comparison Pill - visible on mobile & desktop */}
    <ComparePill />

    <Footer />
  </div>;
};
export default CardListing;