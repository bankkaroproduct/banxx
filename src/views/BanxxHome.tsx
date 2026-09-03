"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import BanxxLanding from "@/views/BanxxLanding";
import CardListing from "@/views/CardListing";
import { persistAttribution, readAttributionFromParams } from "@/lib/attribution";

/**
 * Root route.
 *
 * Credit Links links to `/`, not `/cards`, so the entry URL lands here. When it
 * carries eligibility parameters this route renders the results surface
 * directly rather than redirecting: the URL the user clicked stays intact, a
 * refresh re-hydrates from the same URL, and there is no navigation flash on a
 * paid-traffic first impression.
 *
 * CardListing owns the rest. It handles both the fully-resolved case (skip the
 * form, land on filtered results) and the partial case (render the form
 * prefilled, focus the first unresolved field).
 */
const ELIGIBILITY_PARAMS = ["sal", "pin", "st"] as const;

export default function BanxxHome() {
    const searchParams = useSearchParams();

    const hasEligibilityParams = ELIGIBILITY_PARAMS.some(
        (key) => searchParams.get(key) !== null
    );

    // Attribution is captured even when no eligibility params are present, so a
    // partner link that only carries p2/p3 still credits Credit Links when the
    // user fills the form themselves and clicks through.
    useEffect(() => {
        persistAttribution(readAttributionFromParams(searchParams));
    }, [searchParams]);

    return hasEligibilityParams ? <CardListing /> : <BanxxLanding />;
}
