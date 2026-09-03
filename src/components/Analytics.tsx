"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";
import { analytics } from "@/services/analytics";

function AnalyticsContent() {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    useEffect(() => {
        if (pathname) {
            const url = pathname + searchParams.toString();
            analytics.trackPageView(url);
        }
    }, [pathname, searchParams]);

    return null;
}

export function Analytics() {
    return (
        <Suspense fallback={null}>
            <AnalyticsContent />
        </Suspense>
    );
}
