"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { trackSessionStart, trackPageView } from "@/services/journeyTrack";

/**
 * EVT-001 session_start and EVT-002 page_view, for the whole app.
 *
 * Mounted once in the root layout rather than wired per view. Per-view page
 * events had drifted badly: /cards fired two of them (discover_page_view and a
 * listing_page_view keyed on the loading flag, so it re-fired on every filter
 * change), /about had a tracker that nothing called, and /card-genius,
 * /card-genius-category and /beat-my-card fired nothing at all. One mount that
 * watches the route cannot develop those gaps.
 *
 * The spec wants page_view on "every route change including client-side", so
 * this keys on pathname and re-fires on client navigation. The query string is
 * deliberately not part of the key: filters and eligibility params rewrite it
 * constantly on the listing, and each rewrite is not a new page view.
 */
export function JourneyTracker() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const lastPath = useRef<string | null>(null);

    useEffect(() => {
        // session_start self-guards to once per session; calling it here means
        // it lands before the first page_view whatever the entry route.
        trackSessionStart();
    }, []);

    useEffect(() => {
        if (!pathname || lastPath.current === pathname) return;
        lastPath.current = pathname;
        trackPageView(pathname);
        // searchParams is read so a Suspense boundary is required by Next, but
        // it is intentionally absent from the dependency list — see above.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pathname]);

    return null;
}
