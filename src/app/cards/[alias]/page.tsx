import type { Metadata } from "next";
import CardDetails from "@/views/CardDetails";

interface Props {
  params: Promise<{ alias: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { alias } = await params;
  return {
    robots: 'noindex, nofollow',
    alternates: { canonical: `https://great.cards/credit-card-store/${alias}` },
  };
}

export default function CardDetailsPage() {
  return <CardDetails />;
}
