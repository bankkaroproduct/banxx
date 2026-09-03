"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import {
    brandConfig,
    WORDMARK_MIN_WIDTH_PX,
    WORDMARK_CLEAR_SPACE_PX,
} from "@/config/brand.config";

/**
 * The Banxx wordmark, and the only place the logo asset is referenced.
 *
 * Falls back to a text wordmark when no asset is configured, which is the
 * current state: the Credit Links design team has not supplied a clean SVG, and
 * the available white version is cropped. Setting brandConfig.logo /
 * NEXT_PUBLIC_BRAND_LOGO swaps in the real asset with no other edits.
 *
 * Brand book: minimum 124px reproduction width, 50px clear space all sides. The
 * clear space is applied as a scaled margin so it holds at smaller renderings
 * rather than being a literal 50px at every size.
 */
export function BrandWordmark({
    className = "",
    widthPx = WORDMARK_MIN_WIDTH_PX,
    withClearSpace = false,
}: {
    className?: string;
    widthPx?: number;
    withClearSpace?: boolean;
}) {
    const { resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    const width = Math.max(widthPx, WORDMARK_MIN_WIDTH_PX);
    const isDark = mounted && resolvedTheme === "dark";
    const asset = isDark ? brandConfig.logoDark || brandConfig.logo : brandConfig.logo;

    const clearSpace = withClearSpace
        ? { margin: `${(WORDMARK_CLEAR_SPACE_PX * width) / WORDMARK_MIN_WIDTH_PX / 4}px` }
        : undefined;

    if (asset) {
        return (
            <img
                src={asset}
                alt={brandConfig.name}
                style={{ width, minWidth: WORDMARK_MIN_WIDTH_PX, ...clearSpace }}
                className={`h-auto object-contain ${className}`}
            />
        );
    }

    return (
        <span
            style={{ minWidth: WORDMARK_MIN_WIDTH_PX, ...clearSpace }}
            className={`font-display inline-block text-2xl font-extrabold tracking-tight text-foreground ${className}`}
        >
            {brandConfig.name}
        </span>
    );
}
