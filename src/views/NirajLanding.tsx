"use client";
import { Search, Star, CreditCard, Users, TrendingUp, Mail, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navigation from "@/components/Navigation";
import NirajExpertPicks from "@/components/NirajExpertPicks";
import AdvisorToolsGrid from "@/components/AdvisorToolsGrid";
import Footer from "@/components/Footer";
import { Link } from "@/components/Link";
import {
  trackHomePageView,
  trackHeroSearchBarFocused,
  trackSearchQueryTyped,
  trackSearchSubmitted,
  trackHeroExploreAllCardsClicked,
  trackAboutSubscribeClicked,
} from "@/services/journeyTrack";

const STATS = [
  { value: "130+", label: "Cards Listed", icon: CreditCard },
  { value: "50K+", label: "Users Helped", icon: Users },
  { value: "₹12K", label: "Avg. Savings/yr", icon: TrendingUp },
  { value: "4.9★", label: "User Rating", icon: Star },
];

const NirajLanding = () => {
  const [query, setQuery] = useState("");
  const router = useRouter();

  useEffect(() => {
    trackHomePageView();
  }, []);

  const handleSearch = () => {
    trackSearchSubmitted(query.trim());
    if (query.trim()) {
      router.push(`/cards?q=${encodeURIComponent(query.trim())}`);
    } else {
      router.push("/cards");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSearch();
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      <main className="flex-1">
        {/* ── Hero ─────────────────────────────────────────────── */}
        <section
          className="relative overflow-hidden pt-28 pb-16 md:pt-36 md:pb-20"
          style={{ backgroundColor: "#E8F4FF" }}
        >
          {/* Dot-grid overlay */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              opacity: 0.15,
              backgroundImage: "radial-gradient(circle, #0D2B28 1px, transparent 1px)",
              backgroundSize: "28px 28px",
            }}
          />

          <div className="container relative z-10 flex flex-col items-center text-center max-w-2xl mx-auto px-4">
            {/* Eyebrow */}
            <p
              className="text-xs font-semibold tracking-[0.2em] uppercase mb-4"
              style={{ color: "#2D6B63" }}
            >
              India's Trusted Card Advisor
            </p>

            {/* Headline — Playfair Display */}
            <h1
              className="font-playfair text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.1] tracking-tight mb-5"
              style={{ color: "#0D2B28" }}
            >
              Find the card that rewards{" "}
              <em className="not-italic" style={{ fontStyle: "italic" }}>
                your life
              </em>
            </h1>

            <p
              className="text-base md:text-lg mb-8 max-w-lg"
              style={{ color: "#2D6B63" }}
            >
              Compare 130+ credit cards across rewards, fees and benefits —
              personalised by Niraj Dugar.
            </p>

            {/* Search bar */}
            <div className="w-full max-w-lg">
              <div className="flex items-center gap-0 bg-white rounded-xl shadow-md overflow-hidden border border-[#BDE6E2]/60">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    value={query}
                    onChange={(e) => { setQuery(e.target.value); trackSearchQueryTyped(e.target.value); }}
                    onFocus={() => trackHeroSearchBarFocused()}
                    onKeyDown={handleKeyDown}
                    placeholder="Search by card name or bank…"
                    className="w-full pl-11 pr-4 h-12 text-sm text-gray-800 bg-transparent outline-none placeholder:text-gray-400"
                  />
                </div>
                <button
                  onClick={handleSearch}
                  className="h-12 px-6 text-sm font-semibold text-white flex-shrink-0 transition-colors"
                  style={{ backgroundColor: "#2D6B63" }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#1A5C54")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#2D6B63")}
                >
                  Search
                </button>
              </div>

              {/* Explore Cards button */}
              <div className="mt-3 flex justify-center">
                <Link
                  to="/cards"
                  onClick={() => trackHeroExploreAllCardsClicked("hero")}
                  className="inline-flex items-center gap-1.5 text-sm font-medium px-6 py-2.5 rounded-lg transition-colors"
                  style={{
                    border: "0.5px solid #2D6B63",
                    color: "#2D6B63",
                    backgroundColor: "transparent",
                  }}
                >
                  Explore Cards →
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── Stat Strip ───────────────────────────────────────── */}
        <section style={{ backgroundColor: "#0D2B28" }}>
          <div className="container max-w-4xl mx-auto px-4 py-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-0 md:divide-x md:divide-[#BDE6E2]/20">
              {STATS.map((s) => (
                <div key={s.label} className="flex flex-col items-center text-center py-1">
                  <span
                    className="text-2xl md:text-3xl font-extrabold leading-none"
                    style={{ color: "#BDE6E2" }}
                  >
                    {s.value}
                  </span>
                  <span
                    className="text-xs mt-1 font-medium tracking-wide"
                    style={{ color: "#7EC8C0" }}
                  >
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

<NirajExpertPicks />
        <AdvisorToolsGrid />

        {/* ── Newsletter ───────────────────────────────────────── */}
        <section style={{ backgroundColor: "#0D2B28" }} className="py-16 md:py-20">
          <div className="container max-w-2xl mx-auto px-4 text-center">
            <div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold mb-5"
              style={{ backgroundColor: "rgba(189,230,226,0.1)", border: "1px solid rgba(189,230,226,0.2)", color: "#BDE6E2" }}
            >
              <Mail className="w-4 h-4" />
              CC Newsletter by Niraj
            </div>

            <h2
              className="font-playfair text-3xl md:text-4xl font-bold leading-tight mb-4"
              style={{ color: "#ffffff" }}
            >
              Credit card insights,{" "}
              <em className="not-italic" style={{ fontStyle: "italic", color: "#BDE6E2" }}>
                straight to your inbox
              </em>
            </h2>

            <p className="text-base md:text-lg mb-8 max-w-xl mx-auto" style={{ color: "#7EC8C0" }}>
              Weekly breakdowns on reward strategies, card comparisons, and money moves that actually work — curated by Niraj Dugar.
            </p>

            <a
              href="https://pages.razorpay.com/pl_PROwJapcMzqS0R/view"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackAboutSubscribeClicked("https://pages.razorpay.com/pl_PROwJapcMzqS0R/view")}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-base transition-colors"
              style={{ backgroundColor: "#BDE6E2", color: "#0D2B28" }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#ffffff")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#BDE6E2")}
            >
              Subscribe to Newsletter
              <ArrowRight className="w-4 h-4" />
            </a>

            <p className="mt-4 text-xs" style={{ color: "#7EC8C0" }}>
              No spam. Unsubscribe anytime.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default NirajLanding;
