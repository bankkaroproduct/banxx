import type { Metadata } from "next";
import CardGenius from "@/views/CardGenius";

export const metadata: Metadata = {
  robots: 'noindex, nofollow',
};

export default function CardGeniusPage() {
  return <CardGenius />;
}
