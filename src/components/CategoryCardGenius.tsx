"use client";
import { analytics } from "@/services/analytics";
import {
  trackCcgCategorySelected,
  trackCcgSpendsFilled,
  trackCcgCalculateClicked,
  trackCcgResultsView,
  trackCcgResultCardClicked,
  trackCcgApplyNowClicked,
  trackCcgResetClicked,
} from "@/services/journeyTrack";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Utensils, Fuel, Plane, Coffee, ShoppingCart, CreditCard, ChevronDown, TrendingUp, Sparkles, Loader2 } from "lucide-react";
import { cardService, SpendingData } from "@/services/cardService";
import { Badge } from "./ui/badge";
import { Card } from "./ui/card";
import { SpendingInput } from "./ui/spending-input";
import { useRouter } from "next/navigation";
import { redirectToCardApplication } from "@/utils/redirectHandler";
import EligibilityDialog from "@/components/EligibilityDialog";
import { toast } from "sonner";
import { enrichCardGeniusResults, CardGeniusResult } from "@/lib/cardGenius";
import { feeCalc } from "@/lib/feeUtils";
import { sanitizeHtml } from "@/lib/sanitize";
import { useState, useEffect, useRef } from "react";


const formatCategoryName = (raw: string | null | undefined): string => {
  if (!raw) return "";
  return raw
    .toString()
    .trim()
    .replace(/[_]+/g, " ") // underscores -> spaces
    .replace(/\s+/g, " ") // collapse multiple spaces
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

interface CategoryQuestion {
  field: keyof SpendingData;
  question: string;
  emoji: string;
  min: number;
  max: number;
  step: number;
  showCurrency?: boolean;
  showRupee?: boolean;
  suffix?: string;
  optional?: boolean;
}

interface CategoryConfig {
  id: string;
  name: string;
  icon: any;
  color: string;
  questions: CategoryQuestion[];
}
const creditCardFacts = ["💳 The first credit card was introduced in 1950 by Diners Club!", "🌟 Cashback rewards can save you thousands annually if used smartly", "✈️ Travel cards can get you free flights worth lakhs every year", "🛡️ Credit cards offer better fraud protection than debit cards", "💰 Premium cards often pay for themselves through benefits alone", "🎁 Welcome bonuses can be worth ₹10,000+ on premium cards", "⚡ Using 30% or less of your credit limit boosts your credit score", "🏨 Hotel cards can save you up to 50% on premium stays", "🍽️ Dining cards offer up to 20% savings on restaurant bills", "⛽ Fuel surcharge waivers can save ₹4,000+ annually", "📱 Contactless payments are 10x faster than cash transactions", "🎯 Category-specific cards can give 5-10% returns on spending", "💎 Airport lounge access saves ₹2,000+ per visit", "🔒 EMI conversions at 0% interest can save huge amounts", "🎊 Milestone benefits reward you for regular spending", "🌐 International cards save 3-5% on forex markup fees", "⭐ Co-branded cards offer exclusive brand discounts up to 30%", "🎪 Entertainment cards get you buy-1-get-1 movie tickets", "💡 Smart card users save an average of ₹50,000+ yearly", "🚀 The right card can turn everyday spending into wealth!"];
const categories: CategoryConfig[] = [{
  id: 'shopping',
  name: 'Shopping',
  icon: ShoppingBag,
  color: 'text-pink-500',
  questions: [{
    field: 'amazon_spends',
    question: 'How much do you spend on Amazon in a month?',
    emoji: '🛍️',
    min: 0,
    max: 100000,
    step: 500
  }, {
    field: 'flipkart_spends',
    question: 'How much do you spend on Flipkart in a month?',
    emoji: '📦',
    min: 0,
    max: 100000,
    step: 500
  }, {
    field: 'other_online_spends',
    question: 'How much do you spend on other online shopping?',
    emoji: '💸',
    min: 0,
    max: 50000,
    step: 500
  }, {
    field: 'other_offline_spends',
    question: 'How much do you spend at local shops or offline stores monthly?',
    emoji: '🏪',
    min: 0,
    max: 100000,
    step: 1000
  }]
}, {
  id: 'bills',
  name: 'Paying Bills',
  icon: CreditCard,
  color: 'text-[#0B7A8A]',
  questions: [{
    field: 'mobile_phone_bills',
    question: 'How much do you spend on recharging your mobile or Wi-Fi monthly?',
    emoji: '📱',
    min: 0,
    max: 10000,
    step: 100
  }, {
    field: 'electricity_bills',
    question: "What's your average monthly electricity bill?",
    emoji: '⚡️',
    min: 0,
    max: 10000,
    step: 100
  }, {
    field: 'water_bills',
    question: 'And what about your monthly water bill?',
    emoji: '💧',
    min: 0,
    max: 5000,
    step: 100
  }]
}, {
  id: 'fuel',
  name: 'Fuel',
  icon: Fuel,
  color: 'text-[#0B7A8A]',
  questions: [{
    field: 'fuel',
    question: 'How much do you spend on fuel in a month?',
    emoji: '⛽',
    min: 0,
    max: 20000,
    step: 500
  }]
}, {
  id: 'travel',
  name: 'Flight & Hotel',
  icon: Plane,
  color: 'text-[#0B7A8A]',
  questions: [{
    field: 'flights_annual',
    question: 'How much do you spend on flights in a year?',
    emoji: '✈️',
    min: 0,
    max: 500000,
    step: 5000
  }, {
    field: 'hotels_annual',
    question: 'How much do you spend on hotel stays in a year?',
    emoji: '🛌',
    min: 0,
    max: 300000,
    step: 5000
  }, {
    field: 'domestic_lounge_usage_quarterly',
    question: 'How often do you visit domestic airport lounges in a year?',
    emoji: '🇮🇳',
    min: 0,
    max: 50,
    step: 1,
    showCurrency: false,
    suffix: ' visits',
    optional: true
  }, {
    field: 'international_lounge_usage_quarterly',
    question: 'Plus, what about international airport lounges?',
    emoji: '🌎',
    min: 0,
    max: 50,
    step: 1,
    showCurrency: false,
    suffix: ' visits',
    optional: true
  }]
}, {
  id: 'food_delivery',
  name: 'Food Delivery',
  icon: Coffee,
  color: 'text-red-500',
  questions: [{
    field: 'online_food_ordering',
    question: 'How much do you spend on food delivery apps in a month?',
    emoji: '🛵🍜',
    min: 0,
    max: 30000,
    step: 500
  }]
}, {
  id: 'grocery',
  name: 'Grocery',
  icon: ShoppingCart,
  color: 'text-[#0B7A8A]',
  questions: [{
    field: 'grocery_spends_online',
    question: 'How much do you spend on groceries (Blinkit, Zepto etc.) every month?',
    emoji: '🥦',
    min: 0,
    max: 50000,
    step: 500
  }]
}, {
  id: 'dining',
  name: 'Dining Out',
  icon: Utensils,
  color: 'text-orange-500',
  questions: [{
    field: 'dining_or_going_out',
    question: 'How much do you spend on dining out in a month?',
    emoji: '🥗',
    min: 0,
    max: 30000,
    step: 500
  }]
}];
const CGCAT_KEYS = {
  responses: 'cgcat_responses',
  selectedCategory: 'cgcat_selectedCategory',
  showQuestions: 'cgcat_showQuestions',
  currentQuestionIndex: 'cgcat_currentQuestionIndex',
  results: 'cgcat_results',
} as const;

const cgcatSsGet = <T,>(key: string, fallback: T): T => {
  if (typeof window === 'undefined') return fallback;
  try { return JSON.parse(sessionStorage.getItem(key) ?? 'null') ?? fallback; } catch { return fallback; }
};
const cgcatSsSet = (key: string, value: unknown) => {
  if (typeof window === 'undefined') return;
  try { sessionStorage.setItem(key, JSON.stringify(value)); } catch {}
};
const cgcatSsClear = (...keys: string[]) => {
  if (typeof window === 'undefined') return;
  keys.forEach(k => sessionStorage.removeItem(k));
};

const CategoryCardGenius = () => {
  const router = useRouter();
  const resultsRef = useRef<HTMLDivElement>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
const [showQuestions, setShowQuestions] = useState<boolean>(false);
const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
const [responses, setResponses] = useState<Record<string, number>>({});
const [loading, setLoading] = useState(false);
const [results, setResults] = useState<CardGeniusResult[]>([]);
const [pendingApplyCard, setPendingApplyCard] = useState<any>(null);
const [applyEligibilityDone, setApplyEligibilityDone] = useState(false);

useEffect(() => {
  setSelectedCategory(cgcatSsGet(CGCAT_KEYS.selectedCategory, null));
  setShowQuestions(cgcatSsGet(CGCAT_KEYS.showQuestions, false));
  setCurrentQuestionIndex(cgcatSsGet(CGCAT_KEYS.currentQuestionIndex, 0));
  setResponses(cgcatSsGet(CGCAT_KEYS.responses, {}));
  setResults(cgcatSsGet(CGCAT_KEYS.results, []));
}, []);
  const [currentFactIndex, setCurrentFactIndex] = useState(0);
  const [cardCatalog, setCardCatalog] = useState<any[]>([]);
  const [cardCatalogLoading, setCardCatalogLoading] = useState(false);

  // Rotate facts during loading
  useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        setCurrentFactIndex(prev => (prev + 1) % creditCardFacts.length);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [loading]);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const fetchCatalog = async () => {
      const baseParams = {
        slug: "",
        banks_ids: [],
        card_networks: [],
        annualFees: "",
        credit_score: "",
        sort_by: "",
        free_cards: "",
        eligiblityPayload: {},
        cardGeniusPayload: []
      };

      try {
        setCardCatalogLoading(true);
        const response = await cardService.getCardListing(baseParams, controller.signal);
        if (!isMounted) return;

        const data = Array.isArray(response?.data?.cards)
          ? response.data.cards
          : Array.isArray(response?.data)
            ? response.data
            : [];
        setCardCatalog(Array.isArray(data) ? data : []);
      } catch (error: any) {
        if (error?.name === 'AbortError') {
          return;
        }
        console.error('Failed to preload card catalog:', error);
      } finally {
        if (isMounted) {
          setCardCatalogLoading(false);
        }
      }
    };

    fetchCatalog();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, []);

  // Persist spend flow state to sessionStorage so navigation away and back restores values
  useEffect(() => { cgcatSsSet(CGCAT_KEYS.responses, responses); }, [responses]);
  useEffect(() => { cgcatSsSet(CGCAT_KEYS.selectedCategory, selectedCategory); }, [selectedCategory]);
  useEffect(() => { cgcatSsSet(CGCAT_KEYS.showQuestions, showQuestions); }, [showQuestions]);
  useEffect(() => { cgcatSsSet(CGCAT_KEYS.currentQuestionIndex, currentQuestionIndex); }, [currentQuestionIndex]);
  useEffect(() => { cgcatSsSet(CGCAT_KEYS.results, results); }, [results]);

  const selectedCategoryData = categories.find(c => c.id === selectedCategory);
  const currentQuestion = selectedCategoryData?.questions[currentQuestionIndex];
  const handleCategorySelect = (categoryId: string) => {
    analytics.trackGeniusStart(categoryId);
    trackCcgCategorySelected(categoryId);
    // Clear persisted data for the old category before starting fresh
    cgcatSsClear(...Object.values(CGCAT_KEYS));
    setSelectedCategory(categoryId);
    setShowQuestions(true);
    setCurrentQuestionIndex(0);
    setResponses({});
    setResults([]);
  };
  const handleNext = () => {
    if (!selectedCategoryData) return;

    // Track analytics for the answer
    const currentQ = selectedCategoryData.questions[currentQuestionIndex];
    if (currentQ) {
      analytics.trackGeniusStep(currentQ.field, responses[currentQ.field]);
    }

    if (currentQuestionIndex < selectedCategoryData.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      handleCalculate();
    }
  };
  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };
  const handleCalculate = async () => {
    if (!selectedCategoryData) return;

    const requiredQuestions = selectedCategoryData.questions.filter(q => !q.optional);
    const questionsToCheck = requiredQuestions.length > 0 ? requiredQuestions : selectedCategoryData.questions;
    const hasValue = questionsToCheck.some(q => {
      const val = responses[q.field];
      return typeof val === 'number' && val > 0;
    });

    if (!hasValue) {
      toast.error("Please fill at least one required field before viewing your results.");
      setCurrentQuestionIndex(0);
      return;
    }
    trackCcgSpendsFilled(selectedCategory || undefined, responses);
    trackCcgCalculateClicked(selectedCategory || undefined);
    setLoading(true);
    setCurrentFactIndex(0);
    try {
      const payload: SpendingData = {
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
        ...responses
      };

      const response = await cardService.calculateCardGenius(payload);
      const savingsArray = Array.isArray(response?.data?.savings)
        ? response.data.savings
        : Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response?.data?.cards)
            ? response.data.cards
            : [];

      if (!savingsArray.length) {
        toast.error("We couldn't find matching cards. Try adjusting your inputs.");
        setResults([]);
        return;
      }

      const enriched = await enrichCardGeniusResults({
        savings: savingsArray,
        responses,
        fetchDetails: true
      });

      const topCards = enriched.slice(0, 3);

      setResults(topCards);
      analytics.trackGeniusComplete(selectedCategory || 'unknown', topCards.length);
      trackCcgResultsView(selectedCategory || undefined, topCards.length, topCards[0]?.card_name);

      setTimeout(() => {
        resultsRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }, 100);
    } catch (error) {
      console.error('Error calculating:', error);
      toast.error("Something went wrong while crunching the numbers. Please retry.");
    } finally {
      setLoading(false);
    }
  };
  const resetCalculator = () => {
    trackCcgResetClicked();
    cgcatSsClear(...Object.values(CGCAT_KEYS));
    setSelectedCategory(null);
    setShowQuestions(false);
    setCurrentQuestionIndex(0);
    setResponses({});
    setResults([]);
  };
  const getTotalSpending = () => {
    return Object.values(responses).reduce((sum, val) => sum + val, 0);
  };
  const findCatalogMatch = (card: any) => {
    if (!Array.isArray(cardCatalog) || cardCatalog.length === 0) {
      return null;
    }

    const probes = [card.seo_card_alias, card.card_alias, card.slug, card.card_name, card.name]
      .filter(Boolean)
      .map((value: string) => value.toString().trim().toLowerCase());

    return cardCatalog.find((catalogCard: any) => {
      const catalogAliases = [catalogCard.seo_card_alias, catalogCard.card_alias, catalogCard.slug, catalogCard.name]
        .filter(Boolean)
        .map((value: string) => value.toString().trim().toLowerCase());

      return catalogAliases.some(alias => probes.includes(alias));
    }) || null;
  };
  const handleViewDetails = (card: any) => {
    try {
      const matchingCard = findCatalogMatch(card);
      analytics.trackGeniusResultClick(matchingCard?.card_name || card.card_name || 'unknown');
      analytics.trackCardAction('View Details', matchingCard?.card_name || card.card_name || 'unknown');

      const alias = matchingCard?.seo_card_alias || matchingCard?.card_alias || matchingCard?.slug || card.seo_card_alias || card.card_alias || card.slug;
      trackCcgResultCardClicked(alias, matchingCard?.card_name || card.card_name, selectedCategory || undefined);
      if (alias) {
        router.push(`/cards/${alias}`);
      } else {
        console.warn('No alias found to navigate', {
          card
        });
      }
    } catch (error) {
      console.error('Error navigating to card details:', error);
    }
  };
  const handleApplyNow = (card: any) => {
    try {
      const matchingCard = findCatalogMatch(card) || card;
      analytics.trackGeniusResultClick(matchingCard.card_name || matchingCard.name || card.card_name || 'unknown');
      analytics.trackCardAction('Apply Now', matchingCard.card_name || matchingCard.name || card.card_name || 'unknown');
      trackCcgApplyNowClicked(
        matchingCard.card_name || matchingCard.name || card.card_name,
        matchingCard.seo_card_alias || matchingCard.card_alias || card.seo_card_alias || card.card_alias,
        selectedCategory || undefined
      );

      if (applyEligibilityDone) {
        redirectToCardApplication(matchingCard);
        return;
      }
      setPendingApplyCard(matchingCard);
    } catch (error) {
      console.error('Error applying for card:', error);
      handleViewDetails(card);
    }
  };
  return <><section className="pt-28 sm:pt-32 pb-12 sm:pb-20 bg-gradient-to-br from-[#f0f9ff] via-[#E0F7F9]/5 to-accent/5">
    <div className="section-shell">
      {/* Header - Always visible */}
      <div className="text-center mb-8 sm:mb-12">

        <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 bg-gradient-to-r from-[#0B7A8A] to-[#E0F7F9] bg-clip-text text-transparent px-4">
          Find Best Cards by Category
        </h2>
        <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
          Tell us where you spend, and we'll find the best credit card for you in 30 seconds
        </p>
      </div>

      {/* Category Selection - Always visible */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-4 mb-8 sm:mb-12">
        {categories.map(category => <button key={category.id} onClick={() => handleCategorySelect(category.id)} className={`p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-card shadow-md hover:shadow-xl transition-all text-center group relative overflow-hidden touch-target ${selectedCategory === category.id ? 'ring-2 ring-primary shadow-glow' : ''}`}>
          <div className="absolute inset-0 bg-gradient-to-br from-[#f0f9ff] to-[#E0F7F9]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <category.icon className={`w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 mx-auto mb-2 sm:mb-3 ${category.color} group-hover:scale-110 transition-transform relative z-10`} />
          <p className="text-xs sm:text-sm font-semibold relative z-10">{category.name}</p>
        </button>)}
      </div>

      {/* Results Section */}
      {results && results.length > 0 ? <div ref={resultsRef} className="animate-fade-in scroll-mt-20">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-[#E0F7F9] text-[#0B7A8A] px-6 py-3 rounded-full mb-4 border border-[#0B7A8A]">
            <TrendingUp className="w-5 h-5" />
            <span className="font-bold">Your Personalized Results</span>
          </div>
          <h3 className="text-3xl font-bold mb-3">Top 3 Cards Just For You</h3>
          <p className="text-lg text-muted-foreground">
            Based on your ₹{getTotalSpending().toLocaleString()} monthly {selectedCategoryData?.name.toLowerCase()} spending
          </p>
        </div>

        <div className="cards-grid mb-8 sm:mb-12">
          {results.map((card: any, index: number) => <div key={card.id || index} className="bg-card rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-[#0B7A8A]/20 relative">
            {index === 0 && <div className="absolute top-4 right-4 z-10">
              <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0 px-3 py-1 text-xs font-bold shadow-lg">
                🏆 Best Match
              </Badge>
            </div>}

            {/* Card Image */}
            <div className="relative h-64 overflow-hidden bg-gradient-to-br from-muted to-muted/50">
              <img src={card.card_bg_image || '/placeholder.svg'} alt={card.card_name} className="w-full h-full object-contain p-8 hover:scale-105 transition-transform duration-500" onError={e => { e.currentTarget.src = '/placeholder.svg'; }} />
            </div>

            <div className="p-6">
              {/* Card Name */}
              <h3 className="text-xl font-bold mb-4 min-h-[3rem] line-clamp-2">{card.card_name}</h3>

              {/* Savings Highlight - Prominent */}
              <div className="bg-gradient-to-br from-[#E0F7F9]/20 to-[#E0F7F9]/40 dark:from-[#0B7A8A]/20 dark:to-[#0B7A8A]/40 border-2 border-[#0B7A8A] dark:border-[#0B7A8A] rounded-xl p-5 mb-4 shadow-md">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-[#0B7A8A]" />
                    <span className="text-sm font-bold text-[#0B7A8A] dark:text-[#0B7A8A]">You'll Save</span>
                  </div>
                  <Badge variant="outline" className="text-xs text-[#0B7A8A] dark:text-[#0B7A8A] border-[#0B7A8A] dark:border-[#0B7A8A]">Per Year</Badge>
                </div>
                <p className="text-4xl font-black text-[#0B7A8A] dark:text-[#0B7A8A] mb-2">
                  ₹{Math.round(card.net_savings ?? 0).toLocaleString()}
                </p>
                <div className="space-y-1 text-xs text-[#0B7A8A] dark:text-[#0B7A8A] font-medium">
                  {card.total_savings_yearly ? (
                    <p>Base savings: ₹{Math.round(card.total_savings_yearly).toLocaleString()}</p>
                  ) : null}
                  {card.total_extra_benefits ? <p>Milestones: +₹{Math.round(card.total_extra_benefits).toLocaleString()}</p> : null}
                  {card.airport_lounge_value > 0 && (
                    <>
                      {card.domestic_lounge_value > 0 && (
                        <p>Domestic lounges: +₹{Math.round(card.domestic_lounge_value).toLocaleString()} ({Math.min(responses['domestic_lounge_usage_quarterly'] || 0, card.domestic_lounges_unlocked || 0)} visits × ₹750)</p>
                      )}
                      {card.international_lounge_value > 0 && (
                        <p>International lounges: +₹{Math.round(card.international_lounge_value).toLocaleString()} ({Math.min(responses['international_lounge_usage_quarterly'] || 0, card.international_lounges_unlocked || 0)} visits × ₹1,250)</p>
                      )}
                    </>
                  )}
                  {(feeCalc(card.joining_fee_text).withGST + feeCalc(card.annual_fee_text).withGST) > 0 ? <p>Fees deducted: -₹{(feeCalc(card.joining_fee_text).withGST + feeCalc(card.annual_fee_text).withGST).toLocaleString('en-IN')}</p> : null}
                </div>
              </div>

              {/* Fees */}
              <div className="grid grid-cols-2 gap-3 p-4 bg-muted/50 rounded-lg mb-4">
                <div className="relative group cursor-default">
                  <p className="text-xs text-muted-foreground">Joining Fee</p>
                  <p className="font-semibold">{feeCalc(card.joining_fee_text).display}</p>
                  {feeCalc(card.joining_fee_text).tooltip && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-50 bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap shadow-lg pointer-events-none">
                      {feeCalc(card.joining_fee_text).tooltip}
                    </div>
                  )}
                </div>
                <div className="relative group cursor-default">
                  <p className="text-xs text-muted-foreground">Annual Fee</p>
                  <p className="font-semibold">{feeCalc(card.annual_fee_text).display}</p>
                  {feeCalc(card.annual_fee_text).tooltip && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-50 bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap shadow-lg pointer-events-none">
                      {feeCalc(card.annual_fee_text).tooltip}
                    </div>
                  )}
                </div>
              </div>

              {/* Savings Breakdown */}
              {(card.spending_breakdown && Object.keys(card.spending_breakdown).length > 0) || (card.airport_lounge_value && card.airport_lounge_value > 0) ? (
                <details className="mb-4 bg-muted/30 rounded-lg p-3">
                  <summary className="cursor-pointer text-sm font-bold text-primary hover:text-primary/80 flex items-center gap-2">
                    <ChevronDown className="w-4 h-4" />
                    See Detailed Savings Breakdown
                  </summary>
                  <div className="mt-3 space-y-3">
                    {/* Spending Category Breakdown */}
                    {card.spending_breakdown && Object.entries(card.spending_breakdown).map(([key, data]: [string, any]) => {
                      const savingsValue = Number(data?.savings ?? data?.total_savings ?? 0);
                      const spendValue = Number(data?.spend ?? data?.spending ?? 0);
                      if (!savingsValue && !spendValue) return null;

                      // Always format category name nicely (API may return underscored keys)
                      const rawName =
                        typeof data?.on === "string" && data.on.trim().length > 0
                          ? data.on
                          : key;
                      const categoryName = formatCategoryName(rawName);

                      return (
                        <div key={key} className="bg-white dark:bg-muted/50 rounded-lg p-4 border border-border shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <h4 className="text-sm font-semibold text-foreground mb-1">
                                {categoryName}
                              </h4>
                              {spendValue > 0 && (
                                <p className="text-xs text-muted-foreground">
                                  On ₹{spendValue.toLocaleString()} spend
                                </p>
                              )}
                            </div>
                            <div className="text-right ml-4">
                              <span className="text-lg font-bold text-[#0B7A8A] dark:text-[#0B7A8A]">
                                +₹{Math.round(savingsValue).toLocaleString()}
                              </span>
                            </div>
                          </div>

                          {(() => {
                            if (!Array.isArray(data?.explanation)) return null;
                            const meaningfulBlocks = data.explanation
                              .filter((block: any) => typeof block === 'string' && block.trim() !== '' && block.trim() !== '0');
                            if (!meaningfulBlocks.length) return null;
                            const combinedHtml = meaningfulBlocks
                              .map(block => `<p>${block}</p>`)
                              .join('');
                            return (
                              <div className="mt-3 pt-3 border-t border-muted/50">
                                <div
                                  className="text-xs text-muted-foreground leading-relaxed prose prose-sm max-w-none prose-p:my-1 prose-strong:text-foreground prose-strong:font-semibold"
                                  dangerouslySetInnerHTML={{
                                    __html: sanitizeHtml(combinedHtml)
                                  }}
                                />
                              </div>
                            );
                          })()}
                        </div>
                      );
                    })}

                    {/* Airport Lounge Breakdown */}
                    {card.airport_lounge_value > 0 && (
                      <div className="mt-4 pt-4 border-t-2 border-[#0B7A8A]/30">
                        <h3 className="text-sm font-bold text-primary mb-3 uppercase tracking-wide">
                          Airport Lounge Benefits
                        </h3>

                        <div className="space-y-3">
                          {card.domestic_lounge_value > 0 && (
                            <div className="bg-white dark:bg-muted/50 rounded-lg p-4 border border-border shadow-sm">
                              <div className="flex justify-between items-start mb-2">
                                <div className="flex-1">
                                  <h4 className="text-sm font-semibold text-foreground mb-1">
                                    Domestic Airport Lounges 🇮🇳
                                  </h4>
                                  <p className="text-xs text-muted-foreground">
                                    {Math.min(responses['domestic_lounge_usage_quarterly'] || 0, card.domestic_lounges_unlocked || 0)} visits × ₹750
                                    {card.domestic_lounges_unlocked && card.domestic_lounges_unlocked > 0 && (
                                      <span className="ml-1">(Card allows up to {card.domestic_lounges_unlocked} visits)</span>
                                    )}
                                  </p>
                                </div>
                                <div className="text-right ml-4">
                                  <span className="text-lg font-bold text-[#0B7A8A] dark:text-[#E0F7F9]">
                                    +₹{card.domestic_lounge_value.toLocaleString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}

                          {card.international_lounge_value > 0 && (
                            <div className="bg-white dark:bg-muted/50 rounded-lg p-4 border border-border shadow-sm">
                              <div className="flex justify-between items-start mb-2">
                                <div className="flex-1">
                                  <h4 className="text-sm font-semibold text-foreground mb-1">
                                    International Airport Lounges 🌎
                                  </h4>
                                  <p className="text-xs text-muted-foreground">
                                    {Math.min(responses['international_lounge_usage_quarterly'] || 0, card.international_lounges_unlocked || 0)} visits × ₹1,250
                                    {card.international_lounges_unlocked && card.international_lounges_unlocked > 0 && (
                                      <span className="ml-1">(Card allows up to {card.international_lounges_unlocked} visits)</span>
                                    )}
                                  </p>
                                </div>
                                <div className="text-right ml-4">
                                  <span className="text-lg font-bold text-[#0B7A8A] dark:text-[#E0F7F9]">
                                    +₹{card.international_lounge_value.toLocaleString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}

                          {card.airport_lounge_value > 0 && (
                            <div className="bg-gradient-to-r from-[#E0F7F9]/30 to-[#E0F7F9]/50 dark:from-[#0B7A8A]/30 dark:to-[#0B7A8A]/50 rounded-lg p-4 border-2 border-[#E0F7F9] dark:border-[#0B7A8A]">
                              <div className="flex justify-between items-center">
                                <span className="font-semibold text-foreground">
                                  Total Lounge Value
                                </span>
                                <span className="text-xl font-bold text-[#0B7A8A] dark:text-[#E0F7F9]">
                                  +₹{card.airport_lounge_value.toLocaleString()}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </details>
              ) : null}

              {/* CTA Buttons */}
              <div className="space-y-2">
                <Button className="w-full shadow-lg" size="lg" onClick={() => handleApplyNow(card)}>
                  Apply Now
                </Button>
                <Button variant="outline" className="w-full" size="sm" onClick={() => handleViewDetails(card)}>
                  View Details
                </Button>
              </div>
            </div>
          </div>)}
        </div>
      </div> : loading ? (/* Loading State with Fun Facts */
        <div className="max-w-2xl mx-auto text-center animate-fade-in">
          <div className="bg-card rounded-3xl p-12 shadow-2xl border-2 border-[#0B7A8A]/20">
            <div className="mb-8">
              <Loader2 className="w-16 h-16 mx-auto text-primary animate-spin" />
            </div>
            <h3 className="text-2xl font-bold mb-4">Crunching the numbers...</h3>
            <p className="text-muted-foreground mb-8">
              Our AI is analyzing thousands of card combinations to find your perfect match
            </p>
            <div className="bg-gradient-to-br from-[#E0F7F9] to-[#E0F7F9]/10 rounded-2xl p-6 min-h-[100px] flex items-center justify-center">
              <p className="text-lg font-medium text-foreground animate-fade-in">
                {creditCardFacts[currentFactIndex]}
              </p>
            </div>
          </div>
        </div>) : showQuestions && selectedCategoryData && currentQuestion ? (/* Questions Section */
          <div className="max-w-3xl mx-auto animate-fade-in">
            {/* Progress */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-muted-foreground">
                  Question {currentQuestionIndex + 1} of {selectedCategoryData.questions.length}
                </span>
                <span className="text-sm font-bold text-primary">
                  {Math.round((currentQuestionIndex + 1) / selectedCategoryData.questions.length * 100)}% Complete
                </span>
              </div>
              <div className="w-full h-3 bg-muted rounded-full overflow-hidden shadow-inner">
                <div className="h-full bg-gradient-to-r from-[#0B7A8A] via-[#E0F7F9] to-accent transition-all duration-500 shadow-lg" style={{
                  width: `${(currentQuestionIndex + 1) / selectedCategoryData.questions.length * 100}%`
                }} />
              </div>
            </div>

            {/* Question */}
            <SpendingInput question={currentQuestion.question} emoji={currentQuestion.emoji} value={responses[currentQuestion.field] || 0} onChange={value => setResponses(prev => ({
              ...prev,
              [currentQuestion.field]: value
            }))} min={currentQuestion.min} max={currentQuestion.max} step={currentQuestion.step} showCurrency={currentQuestion.showCurrency ?? true} showRupee={currentQuestion.showRupee ?? true} suffix={currentQuestion.suffix || ""} />

            {/* Navigation */}
            <div className="flex gap-4 mt-8">
              <Button variant="outline" size="lg" onClick={handlePrev} disabled={currentQuestionIndex === 0} className="flex-1">
                Previous
              </Button>
              <Button size="lg" onClick={handleNext} disabled={loading} className="flex-1 shadow-lg">
                {currentQuestionIndex === selectedCategoryData.questions.length - 1 ? <>
                  Show My Results
                  <Sparkles className="ml-2 w-4 h-4" />
                </> : 'Next'}
              </Button>
            </div>

            <div className="text-center mt-6">
              <button onClick={resetCalculator} className="text-muted-foreground hover:text-primary font-medium transition-colors text-sm">
                ← Choose Different Category
              </button>
            </div>
          </div>) : (/* Initial State - Instructions */
        <div className="max-w-2xl mx-auto text-center bg-card rounded-2xl p-8 shadow-lg">
          <p className="text-lg text-muted-foreground mb-6">
            💡 <strong>How it works:</strong> Pick a category above, answer quick questions about your spending,
            and instantly see the top 3 cards that'll save you the most money
          </p>
          <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-[#E0F7F9] text-primary font-bold flex items-center justify-center text-lg">1</div>
              <span className="font-medium">Choose Category</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-[#E0F7F9] text-primary font-bold flex items-center justify-center text-lg">2</div>
              <span className="font-medium">Answer Questions</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-[#E0F7F9] text-primary font-bold flex items-center justify-center text-lg">3</div>
              <span className="font-medium">Get Top 3 Cards</span>
            </div>
          </div>
        </div>)}
    </div>
  </section>
  <EligibilityDialog
    open={!!pendingApplyCard}
    onOpenChange={(open) => {
      if (!open) {
        if (!applyEligibilityDone) {
          toast.error('Please complete eligibility check to apply for a card.');
        }
        setPendingApplyCard(null);
      }
    }}
    onEligibilityComplete={() => setApplyEligibilityDone(true)}
    onEligibilityReset={() => setApplyEligibilityDone(false)}
    cardAlias={pendingApplyCard?.seo_card_alias || pendingApplyCard?.card_alias || ''}
    cardName={pendingApplyCard?.card_name || pendingApplyCard?.name || ''}
    networkUrl={pendingApplyCard?.network_url || pendingApplyCard?.cg_network_url || pendingApplyCard?.ck_store_url || pendingApplyCard?.card_apply_link || ''}
  />
  </>;
};
export default CategoryCardGenius;