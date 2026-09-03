"use client";
import { useState, useEffect } from "react";
import { ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "@/components/Link";
import { authManager } from "@/services/authManager";
import { trackPicksCardDetailsClicked, trackPicksLoadMoreClicked } from "@/services/journeyTrack";

type DisplayCard = {
  name: string;
  bank: string;
  tag: string;
  reward: string;
  fee: string;
  image: string;
  alias: string;
};

// Niraj's curated homepage picks. Images/aliases are resolved live from the
// partner API by alias at runtime; the values below are accurate fallbacks.
const PICKS: DisplayCard[] = [
  { name: "Axis Horizon", bank: "Axis Bank", tag: "Travel", reward: "5 EDGE Miles per ₹100 on travel", fee: "₹3,000/yr", image: "https://offline-agent-bk.s3.ap-south-1.amazonaws.com/BankKaro_20251121_115927133", alias: "axis-bank-horizon-credit-card" },
  { name: "HSBC Travel One", bank: "HSBC", tag: "Travel", reward: "Up to 3 pts per ₹100 + lounge access", fee: "₹4,999/yr", image: "https://offline-agent-bk.s3.ap-south-1.amazonaws.com/BankKaro_20260129_125045722_HSBC%20TravelOne%20Credit%20Card.png", alias: "hsbc-travel-one" },
  { name: "HSBC Live+", bank: "HSBC", tag: "Cashback", reward: "10% cashback on dining & groceries", fee: "₹999/yr", image: "https://offline-agent-bk.s3.ap-south-1.amazonaws.com/AGB_Mockup-22.webp1735897902637", alias: "hsbc-live-plus-credit-card" },
  { name: "Tata Neu Infinity HDFC", bank: "HDFC Bank", tag: "Shopping", reward: "Up to 5% NeuCoins on Tata brands", fee: "₹1,499/yr", image: "https://offline-agent-bk.s3.ap-south-1.amazonaws.com/BankKaro_20260129_124325671_TATA%20Nue.png", alias: "tata-neu-hdfc-bank-credit-card" },
  { name: "HDFC MoneyBack+", bank: "HDFC Bank", tag: "Rewards", reward: "10X points on online spends", fee: "₹500/yr", image: "https://offline-agent-bk.s3.ap-south-1.amazonaws.com/BankKaro_Mockup-7.webp", alias: "hdfc-moneyback-plus-credit-card" },
  { name: "HDFC Marriott Bonvoy", bank: "HDFC Bank", tag: "Hotel", reward: "Free night award + Marriott points", fee: "₹3,000/yr", image: "https://offline-agent-bk.s3.ap-south-1.amazonaws.com/AGB_Mockup-40.webp1736244393195", alias: "hdfc-marriott-bonvoy-credit-card" },
  { name: "HDFC Diners Club Black Metal", bank: "HDFC Bank", tag: "Premium", reward: "5 pts per ₹150 + unlimited lounge", fee: "₹10,000/yr", image: "https://offline-agent-bk.s3.ap-south-1.amazonaws.com/BankKaro_HDFC%20Dineer%20Bc.png", alias: "hdfc-diners-club-black-metal-credit-card" },
  { name: "HDFC Infinia", bank: "HDFC Bank", tag: "Premium", reward: "3.3% reward rate, unlimited lounge", fee: "₹12,500/yr", image: "https://offline-agent-bk.s3.ap-south-1.amazonaws.com/AGB_Mockup%20infinia.webp1737039490824", alias: "hdfc-infinia-credit-card" },
  { name: "Swiggy BLCK HDFC", bank: "HDFC Bank", tag: "Food", reward: "Up to 10% cashback on Swiggy", fee: "₹1,000/yr", image: "https://offline-agent-bk.s3.ap-south-1.amazonaws.com/BankKaro_20260316_12502238_RBL%20%281%29.png", alias: "swiggy-blck-hdfc-credit-card" },
  { name: "HDFC BizBlack Metal", bank: "HDFC Bank", tag: "Business", reward: "5 pts per ₹150 + premium perks", fee: "₹10,000/yr", image: "https://offline-agent-bk.s3.ap-south-1.amazonaws.com/BankKaro_Mockup%20%2818%29.png", alias: "hdfc-biz-black-metal-edition-credit-card" },
  { name: "ICICI Emeralde Private Metal", bank: "ICICI Bank", tag: "Premium", reward: "6 pts per ₹200 + golf & lounge", fee: "₹12,499/yr", image: "https://offline-agent-bk.s3.ap-south-1.amazonaws.com/BankKaro_20260407_121526142_IDFC%20FIRST%20Indigo%20Credit%20Card%20%20-mockup%20%287%29.png", alias: "icici-emeralde-private-metal-credit-card" },
  { name: "Amazon Pay ICICI", bank: "ICICI Bank", tag: "Cashback", reward: "5% back on Amazon for Prime members", fee: "Lifetime Free", image: "https://offline-agent-bk.s3.ap-south-1.amazonaws.com/BankKaro_Mobile.png", alias: "icici-amazon-pay-credit-card" },
  { name: "Times Black ICICI", bank: "ICICI Bank", tag: "Premium", reward: "Unlimited lounge + luxury privileges", fee: "₹20,000/yr", image: "https://offline-agent-bk.s3.ap-south-1.amazonaws.com/BankKaro_Times%20Black%20ICICI%20Bank%20Credit%20Card-mockup.png", alias: "times-black-credit-card" },
  { name: "Amex Platinum Reserve", bank: "American Express", tag: "Premium", reward: "Lounge access + Membership Rewards", fee: "₹10,000/yr", image: "https://offline-agent-bk.s3.ap-south-1.amazonaws.com/BankKaro_Mockup%20%2816%29.png", alias: "american-express-platinum-reserve" },
  { name: "Scapia", bank: "Federal Bank", tag: "Travel", reward: "Zero forex + 20% back on travel", fee: "Lifetime Free", image: "https://offline-agent-bk.s3.ap-south-1.amazonaws.com/BankKaro_20260129_124937259_Scapia.png", alias: "scapia-credit-card" },
  { name: "SBI Cashback", bank: "SBI Card", tag: "Cashback", reward: "5% cashback on online spends", fee: "₹999/yr", image: "https://offline-agent-bk.s3.ap-south-1.amazonaws.com/AGB_Mockup-24.webp1736921642945", alias: "sbi-cashback-credit-card" },
  { name: "PhonePe SBI SELECT Black", bank: "SBI Card", tag: "Rewards", reward: "Rewards on PhonePe & everyday spends", fee: "₹1,499/yr", image: "https://offline-agent-bk.s3.ap-south-1.amazonaws.com/BankKaro_20260408_171510212_IDFC%20FIRST%20Indigo%20Credit%20Card%20%20-mockup%20%289%29.png", alias: "sbi-phonepe-select-black-credit-card" },
  { name: "IRCTC SBI Platinum", bank: "SBI Card", tag: "Travel", reward: "Up to 10% back on train tickets", fee: "₹500/yr", image: "https://offline-agent-bk.s3.ap-south-1.amazonaws.com/BankKaro_20260210_142227865_Mockup%20%287%29.png", alias: "irctc-sbi-platinum-card" },
  { name: "BOB Eterna", bank: "Bank of Baroda", tag: "Rewards", reward: "15X points on travel & dining", fee: "₹2,499/yr", image: "https://offline-agent-bk.s3.ap-south-1.amazonaws.com/BankKaro_20260603_110039216_Mockup%20%2836%29.png", alias: "bob-eterna-credit-card" },
  { name: "Equitas Selfe", bank: "Equitas SFB", tag: "Cashback", reward: "Cashback on everyday spends", fee: "₹1,000/yr", image: "https://offline-agent-bk.s3.ap-south-1.amazonaws.com/BankKaro_20260601_115236145_Mockup%20%2831%29.png", alias: "equitas-selfe-credit-card" },
  { name: "Equitas PowerMiles", bank: "Equitas SFB", tag: "Travel", reward: "Miles on every spend", fee: "₹5,000/yr", image: "https://offline-agent-bk.s3.ap-south-1.amazonaws.com/BankKaro_20260601_180000261_Mockup%20%2832%29.png", alias: "equitas-power-miles-credit-card" },
];

type ApiCard = { id: number; name: string; card_bg_image?: string; image?: string; seo_card_alias?: string; alias?: string };

// Resolve the freshest image/alias from the live API by matching on alias.
function resolveFromApi(apiCards: ApiCard[]): DisplayCard[] {
  const byAlias = new Map<string, ApiCard>();
  for (const c of apiCards) {
    const a = c.seo_card_alias || c.alias;
    if (a) byAlias.set(a, c);
  }
  return PICKS.map((p) => {
    const match = byAlias.get(p.alias);
    if (!match) return { ...p };
    const img = match.card_bg_image || match.image;
    return { ...p, ...(img ? { image: img } : {}) };
  });
}

const NirajExpertPicks = () => {
  const [cards, setCards] = useState<DisplayCard[]>(PICKS);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    authManager.makeAuthenticatedRequest("/api/proxy/cardgenius/cards?sort_by=priority")
      .then((r) => r.json())
      .then((data) => {
        let apiCards: ApiCard[] = [];
        if (data?.status === "success" && Array.isArray(data?.data?.cards)) apiCards = data.data.cards;
        else if (Array.isArray(data?.data)) apiCards = data.data;
        else if (Array.isArray(data)) apiCards = data;
        if (apiCards.length > 0) setCards(resolveFromApi(apiCards));
      })
      .catch(() => {});
  }, []);

  const prev = () => setCurrent((c) => (c - 1 + cards.length) % cards.length);
  const next = () => {
    trackPicksLoadMoreClicked();
    setCurrent((c) => (c + 1) % cards.length);
  };

  // Show 3 at a time on desktop, 1 on mobile
  const visible = [
    cards[current % cards.length],
    cards[(current + 1) % cards.length],
    cards[(current + 2) % cards.length],
  ];

  return (
    <section className="py-14 md:py-20 bg-white">
      <div className="container max-w-5xl mx-auto px-4">
        <div className="text-center mb-10 md:mb-14">
          <p
            className="text-xs font-semibold tracking-[0.18em] uppercase mb-2"
            style={{ color: "#2D6B63" }}
          >
            Handpicked Selection
          </p>
          <h2
            className="text-3xl md:text-4xl font-extrabold tracking-tight"
            style={{ color: "#0D2B28" }}
          >
            Niraj's Top Card Picks
          </h2>
          <p className="mt-3 max-w-lg mx-auto text-sm md:text-base" style={{ color: "#2D6B63" }}>
            Premium credit cards for maximum rewards, travel perks &amp; lifestyle benefits.
          </p>
        </div>

        <div className="relative">
          {/* Cards grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {visible.map((card, i) => (
              <div
                key={`${card.alias}-${i}`}
                className="rounded-2xl overflow-hidden flex flex-col shadow-sm hover:shadow-lg transition-shadow duration-200"
                style={{
                  background: "linear-gradient(145deg, #E8F6F4 0%, #BDE6E2 100%)",
                  border: "1px solid #BDE6E2",
                }}
              >
                {/* Top row: badge + fee */}
                <div className="flex items-center justify-between px-4 pt-4 pb-2">
                  <span
                    className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
                    style={{ backgroundColor: "#1A3B38", color: "#BDE6E2" }}
                  >
                    {card.tag}
                  </span>
                  <span className="text-xs font-semibold" style={{ color: "#2D6B63" }}>
                    {card.fee}
                  </span>
                </div>

                {/* Card image */}
                <div className="px-4 py-2">
                  <img
                    src={card.image}
                    alt={card.name}
                    loading="lazy"
                    className="w-full h-40 rounded-xl object-cover"
                    onError={(e) => { e.currentTarget.src = "/placeholder.svg"; }}
                  />
                </div>

                {/* Card info */}
                <div className="px-4 py-2 flex-1">
                  <h3
                    className="text-base font-bold leading-tight"
                    style={{ color: "#0D2B28" }}
                  >
                    {card.name}
                  </h3>
                  <p className="text-xs mt-0.5" style={{ color: "#2D6B63" }}>
                    {card.bank} · {card.reward}
                  </p>
                </div>

                {/* Buttons */}
                <div className="px-4 pb-4 pt-2">
                  <Link
                    to={`/cards/${card.alias}`}
                    className="w-full text-center text-xs font-semibold py-2 rounded-lg transition-colors flex items-center justify-center gap-1"
                    style={{ backgroundColor: "#1A3B38", color: "#BDE6E2" }}
                    onClick={() => trackPicksCardDetailsClicked(card.alias, card.name, card.tag)}
                  >
                    View Details <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Prev / Next controls */}
          <div className="flex justify-center gap-3 mt-8">
            <button
              onClick={prev}
              className="h-9 w-9 rounded-full flex items-center justify-center transition-colors"
              style={{ border: "1px solid #2D6B63", color: "#2D6B63", backgroundColor: "transparent" }}
              aria-label="Previous"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={next}
              className="h-9 w-9 rounded-full flex items-center justify-center transition-colors"
              style={{ backgroundColor: "#2D6B63", color: "white" }}
              aria-label="Next"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default NirajExpertPicks;
