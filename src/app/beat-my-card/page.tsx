import type { Metadata } from "next";
import BeatMyCard from "@/views/BeatMyCard";

export const metadata: Metadata = {
  robots: 'noindex, nofollow',
};

export default function BeatMyCardPage() {
  return <BeatMyCard />;
}
