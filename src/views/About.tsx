"use client";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Link } from "@/components/Link";
import { BrandWordmark } from "@/components/BrandWordmark";
import { brandConfig } from "@/config/brand.config";
import { ListChecks, Landmark, Calculator, ShieldCheck } from "lucide-react";

const HOW_IT_WORKS = [
    {
        icon: ListChecks,
        title: "Three details",
        body: "Pincode, monthly in-hand income and employment type. That is the whole eligibility check. No documents, no credit-report pull, no phone call.",
    },
    {
        icon: Landmark,
        title: "Filtered to what you can get",
        body: "Cards you are unlikely to be approved for are filtered out, so you are not comparing options that will decline you.",
    },
    {
        icon: Calculator,
        title: "Worth, not just rewards",
        body: "Enter what you spend and each card is scored on what it actually returns against your pattern, with the working shown.",
    },
];

export default function About() {
    return (
        <div className="flex min-h-screen flex-col">
            <Navigation />

            <main className="flex-1 pt-24 md:pt-28">
                <section className="container mx-auto max-w-3xl px-4 py-12">
                    <BrandWordmark widthPx={160} />

                    <h1 className="font-display mt-6 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                        About {brandConfig.name}
                    </h1>

                    <p className="mt-4 text-base text-muted-foreground md:text-lg">
                        {brandConfig.name} helps you find a credit card you are actually likely
                        to get, and then shows what it is worth on the way you spend. The card
                        data, eligibility checks and savings calculations are provided by
                        BankKaro&apos;s card platform.
                    </p>

                    <div className="mt-10 space-y-6">
                        {HOW_IT_WORKS.map((item) => (
                            <div
                                key={item.title}
                                className="rounded-2xl border border-border bg-card p-6 shadow-card"
                            >
                                <item.icon
                                    className="mb-3 h-5 w-5 text-accent-text"
                                    aria-hidden="true"
                                />
                                <h2 className="mb-2 text-lg font-bold text-card-foreground">
                                    {item.title}
                                </h2>
                                <p className="text-sm text-muted-foreground">{item.body}</p>
                            </div>
                        ))}
                    </div>

                    <div className="mt-10 rounded-2xl border border-border bg-surface-elevated p-6">
                        <ShieldCheck
                            className="mb-3 h-5 w-5 text-accent-text"
                            aria-hidden="true"
                        />
                        <h2 className="mb-2 text-lg font-bold text-surface-elevated-foreground">
                            How we make money, and what that means for you
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            When you apply for a card through {brandConfig.name} we may earn a
                            referral fee from the bank. That is how the tools stay free. It does
                            not change the eligibility result or the savings calculation, and it
                            does not change what the card costs you. Eligibility is indicative:
                            the bank makes the final decision and may ask for documents at the
                            application stage.
                        </p>
                    </div>

                    <div className="mt-10">
                        <Link
                            to="/cards"
                            className="inline-flex items-center rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover"
                        >
                            Check my eligibility
                        </Link>
                    </div>

                    <p className="mt-8 text-sm text-muted-foreground">
                        Questions?{" "}
                        <a
                            href={`mailto:${brandConfig.email}`}
                            className="font-medium text-accent-text hover:underline"
                        >
                            {brandConfig.email}
                        </a>
                    </p>
                </section>
            </main>

            <Footer />
        </div>
    );
}
