import type { Metadata } from "next";
import { Raleway } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Analytics } from "@/components/Analytics";
import { brandConfig } from "@/config/brand.config";

/**
 * Raleway, self-hosted by next/font. Self-hosting matters here: the CSP in
 * next.config.mjs sets `font-src 'self' data:`, so a runtime fetch from
 * fonts.gstatic.com would be blocked.
 */
const raleway = Raleway({
    subsets: ["latin"],
    variable: "--font-raleway",
    display: "swap",
});

export const metadata: Metadata = {
    title: `${brandConfig.name} - ${brandConfig.tagline}`,
    description: brandConfig.tagline,
    // Paid affiliate surface carrying eligibility parameters in the query
    // string. There is no SEO case for indexing it. Also enforced as an
    // X-Robots-Tag header and in robots.txt.
    robots: { index: false, follow: false },
    icons: {
        icon: brandConfig.favicon,
        shortcut: brandConfig.favicon,
        apple: brandConfig.favicon,
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        // suppressHydrationWarning is required by next-themes: it writes the
        // theme class onto <html> before React hydrates.
        <html lang="en" suppressHydrationWarning>
            <body className={`${raleway.variable} font-sans`}>
                <Analytics />
                <Providers>{children}</Providers>
            </body>
        </html>
    );
}
