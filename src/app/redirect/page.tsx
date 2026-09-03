import { Suspense } from "react";
import RedirectInterstitial from "@/views/RedirectInterstitial";

export default function RedirectPage() {
    return (
        <Suspense fallback={<div>Redirecting...</div>}>
            <RedirectInterstitial />
        </Suspense>
    );
}
