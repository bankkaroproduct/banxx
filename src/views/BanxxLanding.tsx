"use client";
import { useEffect } from "react";
import { FileX2, ListChecks, Landmark, IndianRupee } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import BanxxToolsGrid from "@/components/BanxxToolsGrid";
import PartnerEntryForm from "@/components/PartnerEntryForm";
import { brandConfig } from "@/config/brand.config";
import { trackHomePageView } from "@/services/journeyTrack";

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
    useEffect(() => {
        trackHomePageView();
    }, []);

    return (
        <div className="flex min-h-screen flex-col">
            <Navigation />

            <main className="flex-1">
                {/* Hero: eligibility form first. The user provides their basis here,
                    then lands on the listing showing only the cards they qualify for. */}
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

                        <PartnerEntryForm />
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

                <BanxxToolsGrid />
            </main>

            <Footer />
        </div>
    );
}
