import { Suspense } from "react";
import type { Metadata } from "next";
import NirajLanding from "@/views/NirajLanding";

export const metadata: Metadata = {
  title: "Niraj Dugar — Credit Card Expert",
  description:
    "Expert credit card recommendations by Niraj Dugar. Discover India's best credit cards for rewards, travel, cashback, and lifestyle.",
  robots: "index, follow",
  alternates: { canonical: "https://great.cards" },
};

export default function Home() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <NirajLanding />
    </Suspense>
  );
}
