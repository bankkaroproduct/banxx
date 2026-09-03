import { Suspense } from "react";
import type { Metadata } from "next";
import CardListing from "@/views/CardListing";

export const metadata: Metadata = {
  robots: 'noindex, nofollow',
};

export default function CardsPage() {
    return (
        <Suspense fallback={<div>Loading cards...</div>}>
            <CardListing />
        </Suspense>
    );
}
