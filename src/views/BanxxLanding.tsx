"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, FileX2, ListChecks, Landmark, IndianRupee } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import BanxxToolsGrid from "@/components/BanxxToolsGrid";
import PopularCreditCards from "@/components/PopularCreditCards";
import { Link } from "@/components/Link";
import { brandConfig } from "@/config/brand.config";
import {
    trackHomePageView,
    trackHeroSearchBarFocused,
    trackSearchQueryTyped,
    trackSearchSubmitted,
    trackHeroExploreAllCardsClicked,
} from "@/services/journeyTrack";

/**
 * Value propositions, deliberately non-numeric.
 *
 * The template this repo is based on shipped a stat strip with hardcoded
 * "50K+ Users Helped" and "₹12K Avg. Savings/yr". Those were the template
 * owner's claims, had no data source, and reproduced here would become Banxx
 * claims about a deployment that has served no Banxx users. "Avg. savings" in
 * particular is a financial claim. Replaced with statements that are true of
 * the product as built.
 */
const VALUE_PROPS = [
    { icon: FileX2, label: "No documents to upload" },
    { icon: ListChecks, label: "Eligibility from three details" },
    { icon: Landmark, label: "Compared across banks" },
    { icon: IndianRupee, label: "Free to use" },
];

export default function BanxxLanding() {
    const [query, setQuery] = useState("");
    const router = useRouter();

    useEffect(() => {
        trackHomePageView();
    }, []);

    const handleSearch = () => {
        trackSearchSubmitted(query.trim());
        router.push(query.trim() ? `/cards?q=${encodeURIComponent(query.trim())}` : "/cards");
    };

    return (
        <div className="flex min-h-screen flex-col">
            <Navigation />

            <main className="flex-1">
                {/* Hero */}
                <section className="relative overflow-hidden bg-gradient-hero pb-16 pt-28 md:pb-20 md:pt-36">
                    <div className="container relative z-10 mx-auto flex max-w-2xl flex-col items-center px-4 text-center">
                        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-accent-text">
                            {brandConfig.name}
                        </p>

                        <h1 className="font-display mb-5 text-4xl font-bold leading-[1.1] tracking-tight text-foreground md:text-5xl lg:text-6xl">
                            Find the credit card you actually qualify for
                        </h1>

                        <p className="mb-8 max-w-lg text-base text-muted-foreground md:text-lg">
                            Check eligibility with three details, then compare what each card is
                            worth on your spending. No documents, no calls.
                        </p>

                        <div className="w-full max-w-lg">
                            <div className="flex items-center overflow-hidden rounded-xl border border-border bg-card shadow-md">
                                <div className="relative flex-1">
                                    <Search
                                        className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                                        aria-hidden="true"
                                    />
                                    <label htmlFor="hero-search" className="sr-only">
                                        Search by card name or bank
                                    </label>
                                    <input
                                        id="hero-search"
                                        value={query}
                                        onChange={(e) => {
                                            setQuery(e.target.value);
                                            trackSearchQueryTyped(e.target.value);
                                        }}
                                        onFocus={() => trackHeroSearchBarFocused()}
                                        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                                        placeholder="Search by card name or bank"
                                        className="h-12 w-full bg-transparent pl-11 pr-4 text-sm text-card-foreground outline-none placeholder:text-muted-foreground"
                                    />
                                </div>
                                <button
                                    onClick={handleSearch}
                                    className="h-12 flex-shrink-0 bg-primary px-6 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover"
                                >
                                    Search
                                </button>
                            </div>

                            <div className="mt-3 flex justify-center">
                                <Link
                                    to="/cards"
                                    onClick={() => trackHeroExploreAllCardsClicked("hero")}
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-primary px-6 py-2.5 text-sm font-medium text-accent-text transition-colors hover:bg-accent"
                                >
                                    Check my eligibility
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Value props */}
                <section className="border-y border-border bg-surface-elevated">
                    <div className="container mx-auto max-w-4xl px-4 py-6">
                        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
                            {VALUE_PROPS.map((prop) => (
                                <div
                                    key={prop.label}
                                    className="flex flex-col items-center gap-2 text-center"
                                >
                                    <prop.icon className="h-5 w-5 text-accent-text" aria-hidden="true" />
                                    <span className="text-xs font-medium text-surface-elevated-foreground">
                                        {prop.label}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <PopularCreditCards />
                <BanxxToolsGrid />
            </main>

            <Footer />
        </div>
    );
}
