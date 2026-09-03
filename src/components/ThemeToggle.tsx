"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

/**
 * Light/dark toggle.
 *
 * Renders a stable placeholder until mounted: the server cannot know the
 * persisted theme, so rendering the real icon on the first pass would produce a
 * hydration mismatch.
 */
export function ThemeToggle({ className = "" }: { className?: string }) {
    const { resolvedTheme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);

    const isDark = mounted && resolvedTheme === "dark";

    return (
        <button
            type="button"
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-surface-elevated hover:text-foreground ${className}`}
        >
            {mounted ? (
                isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />
            ) : (
                <span className="h-4 w-4" />
            )}
        </button>
    );
}
