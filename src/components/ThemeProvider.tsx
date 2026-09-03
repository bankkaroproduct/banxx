"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

/**
 * Theme provider for Banxx.
 *
 * `enableSystem` is deliberately off. With it on, next-themes defaults to the
 * OS preference, which would make dark the default for a large share of users.
 * The brief specifies light as the default with dark user-toggleable.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
    return (
        <NextThemesProvider
            attribute="class"
            defaultTheme="light"
            enableSystem={false}
            disableTransitionOnChange
        >
            {children}
        </NextThemesProvider>
    );
}
