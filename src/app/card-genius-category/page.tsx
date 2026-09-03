import type { Metadata } from "next";
import CardGeniusCategory from "@/views/CardGeniusCategory";

export const metadata: Metadata = {
  robots: 'noindex, nofollow',
};

export default function CardGeniusCategoryPage() {
  return <CardGeniusCategory />;
}
