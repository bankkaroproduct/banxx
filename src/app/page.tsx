import { Suspense } from "react";
import type { Metadata } from "next";
import BanxxHome from "@/views/BanxxHome";
import { brandConfig } from "@/config/brand.config";

export const metadata: Metadata = {
    title: `${brandConfig.name} - ${brandConfig.tagline}`,
    description:
        "Check which credit cards you are eligible for using three details, then compare what each one is worth on your spending.",
    // Paid affiliate surface: the entry URL carries eligibility parameters.
    robots: "noindex, nofollow",
};

export default function Home() {
    return (
        <Suspense fallback={<div className="min-h-screen" />}>
            <BanxxHome />
        </Suspense>
    );
}
