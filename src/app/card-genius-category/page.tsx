import type { Metadata } from "next";
import CardGeniusCategory from "@/views/CardGeniusCategory";

export const metadata: Metadata = {
  robots: 'noindex, follow',
  alternates: { canonical: 'https://great.cards/cg-360' },
};

export default function CardGeniusCategoryPage() {
  return <CardGeniusCategory />;
}
