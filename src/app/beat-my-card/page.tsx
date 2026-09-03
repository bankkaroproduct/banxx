import type { Metadata } from "next";
import BeatMyCard from "@/views/BeatMyCard";

export const metadata: Metadata = {
  robots: 'noindex, follow',
  alternates: { canonical: 'https://great.cards/beat-my-card' },
};

export default function BeatMyCardPage() {
  return <BeatMyCard />;
}
