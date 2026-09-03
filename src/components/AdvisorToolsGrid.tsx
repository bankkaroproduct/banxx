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
    title: "Super Card Genius",
    description:
      "Get AI-powered recommendations for the perfect credit card based on your spending habits.",
    to: "/card-genius",
    track: () => trackHomepageSuperCardGeniusClicked("Super Card Genius", "tools_section"),
  },
  {
    icon: Swords,
    title: "Beat My Card",
    description:
      "Find a better card than the one you already have — compare benefits, fees, and rewards instantly.",
    to: "/beat-my-card",
    track: () => trackHomepageBeatMyCardClicked("Beat My Card", "tools_section"),
  },
  {
    icon: LayoutGrid,
    title: "Category Card Genius",
    description:
      "Discover the best credit card for any spending category — fuel, travel, groceries, and more.",
    to: "/card-genius-category",
    track: () => trackHomepageCategoryCardGeniusClicked("Category Card Genius", "tools_section"),
  },
];

const AdvisorToolsGrid = () => {
  return (
    <section className="py-16 md:py-24" style={{ backgroundColor: "#0D2B28" }}>
      <div className="container max-w-5xl mx-auto px-4">
        <div className="text-center mb-12">
          <p
            className="text-xs font-semibold tracking-[0.18em] uppercase mb-2"
            style={{ color: "#7EC8C0" }}
          >
            Niraj's Toolkit
          </p>
          <h2
            className="text-3xl md:text-4xl font-bold tracking-tight"
            style={{ color: "#BDE6E2" }}
          >
            Powerful Financial Tools
          </h2>
          <p className="mt-3 text-base" style={{ color: "#7EC8C0" }}>
            Everything you need to make smarter credit card decisions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {tools.map((tool) => (
            <Link
              to={tool.to}
              key={tool.title}
              onClick={tool.track}
              className="group rounded-2xl p-8 flex flex-col transition-all duration-300 hover:-translate-y-1"
              style={{
                backgroundColor: "rgba(189,230,226,0.08)",
                border: "1px solid #BDE6E2",
              }}
            >
              {/* Icon */}
              <div
                className="inline-flex items-center justify-center h-12 w-12 rounded-xl mb-5"
                style={{ backgroundColor: "rgba(189,230,226,0.12)" }}
              >
                <tool.icon
                  className="h-6 w-6"
                  style={{ color: "#BDE6E2", stroke: "#BDE6E2" }}
                />
              </div>

              <h3
                className="text-lg font-bold mb-2"
                style={{ color: "#BDE6E2" }}
              >
                {tool.title}
              </h3>

              <p
                className="text-sm leading-relaxed mb-5 flex-1"
                style={{ color: "#7EC8C0" }}
              >
                {tool.description}
              </p>

              <span
                className="inline-flex items-center gap-1 text-sm font-semibold group-hover:gap-2 transition-all"
                style={{ color: "#BDE6E2" }}
              >
                Try Now <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AdvisorToolsGrid;
