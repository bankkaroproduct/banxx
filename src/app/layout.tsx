import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Analytics } from "@/components/Analytics";
import { brandConfig } from "@/config/brand.config";
import { BrandStyles } from "@/components/BrandStyles";
import { SEOTags } from "@/components/SEOTags";

const inter = Inter({ subsets: ["latin"] });
const playfair = Playfair_Display({
    subsets: ["latin"],
    variable: "--font-playfair",
    style: ["normal", "italic"],
});

export const metadata: Metadata = {
    title: `${brandConfig.name} - ${brandConfig.tagline}`,
    description: brandConfig.tagline,
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
        <html lang="en">
            <head>
                <BrandStyles />
            </head>
            <body className={`${inter.className} ${playfair.variable}`}>
                <SEOTags />
                <Analytics />
                <Providers>{children}</Providers>
            </body>
        </html>
    );
}
