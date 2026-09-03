"use client";
import { ArrowRight, Sparkles, Swords, LayoutGrid } from "lucide-react";
import { Link } from "@/components/Link";
import {
    trackHomepageSuperCardGeniusClicked,
    trackHomepageBeatMyCardClicked,
    trackHomepageCategoryCardGeniusClicked,
} from "@/services/journeyTrack";

const tools = [
    {
        icon: Sparkles,
        title: "Card Genius",
        description:
            "Enter what you spend each month and see which card returns the most, with the working shown.",
        to: "/card-genius",
        track: () => trackHomepageSuperCardGeniusClicked("Super Card Genius", "tools_section"),
    },
    {
        icon: Swords,
        title: "Beat My Card",
        description:
            "Already have a card? Compare it against the market on rewards, fees and benefits.",
        to: "/beat-my-card",
        track: () => trackHomepageBeatMyCardClicked("Beat My Card", "tools_section"),
    },
    {
        icon: LayoutGrid,
        title: "Category Picks",
        description:
            "Find the strongest card for one category: fuel, travel, groceries, dining or utilities.",
        to: "/card-genius-category",
        track: () => trackHomepageCategoryCardGeniusClicked("Category Card Genius", "tools_section"),
    },
];

export default function BanxxToolsGrid() {
    return (
        <section className="bg-primary py-16 md:py-24">
            <div className="container mx-auto max-w-5xl px-4">
                <div className="mb-12 text-center">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary-foreground/70">
                        Tools
                    </p>
                    <h2 className="font-display text-3xl font-bold tracking-tight text-primary-foreground md:text-4xl">
                        Work out which card actually pays
                    </h2>
                    <p className="mt-3 text-base text-primary-foreground/80">
                        Every recommendation shows the numbers behind it.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                    {tools.map((tool) => (
                        <Link
                            key={tool.title}
                            to={tool.to}
                            onClick={tool.track}
                            className="group rounded-2xl bg-card p-6 shadow-card transition-shadow hover:shadow-card-hover"
                        >
                            <tool.icon className="mb-4 h-6 w-6 text-accent-text" aria-hidden="true" />
                            <h3 className="mb-2 text-lg font-bold text-card-foreground">{tool.title}</h3>
                            <p className="mb-4 text-sm text-muted-foreground">{tool.description}</p>
                            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent-text">
                                Open
                                <ArrowRight
                                    className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                                    aria-hidden="true"
                                />
                            </span>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}
