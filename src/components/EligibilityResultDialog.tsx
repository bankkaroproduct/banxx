"use client";

import React from "react";
import { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { extractEligibleAliases } from '@/services/cardService';
import { CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';
import confetti from 'canvas-confetti';
import { openRedirectInterstitial } from '@/utils/redirectHandler';
import { useRouter } from 'next/navigation';

interface EligibilityResultDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  result: any;
  cardName: string;
  cardAlias: string;
  networkUrl?: string;
  onRecheck: () => void;
}

export default function EligibilityResultDialog({
  open,
  onOpenChange,
  result,
  cardName,
  cardAlias,
  networkUrl,
  onRecheck
}: EligibilityResultDialogProps) {
  const router = useRouter();

  // /cg-eligiblity returns data: [{seo_card_alias, eligible, ...}]
  //
  // The authoritative signal is `eligible === true` on the matched card, which
  // is what every other call site uses (see extractEligibleAliases). This
  // previously also required `result.status === 'success'` as a string, while
  // the listing, the Card Genius popover and the submit handler all treat
  // `status` as merely truthy. If the API returns `status: true` rather than
  // the string, that strict check made an eligible user see "not eligible" and
  // suppressed the apply CTA entirely, so the click-out never happened.
  // `result` is only ever set after a successful response, so request success
  // is already established by the time this renders.
  const cards: any[] = Array.isArray(result?.data) ? result.data : [];
  const matchedCard = cards.find((c: any) => (c?.seo_card_alias || c?.card_alias) === cardAlias) ?? null;
  const isEligible = extractEligibleAliases(result ?? {}).includes(cardAlias);
  const hasData = result !== null && result !== undefined;

  useEffect(() => {
    if (open && isEligible) {
      // Trigger confetti for eligible result
      const duration = 2000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 2,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#6A35FF', '#9B7BFF', '#F4F2FF', '#5A2BE0']
        });
        confetti({
          particleCount: 2,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#6A35FF', '#9B7BFF', '#F4F2FF', '#5A2BE0']
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };

      frame();

      // Mark as seen in session storage
      sessionStorage.setItem(`hasSeenEligibilityResult_${cardAlias}`, 'true');
    }
  }, [open, isEligible, cardAlias]);

  // Resolve the best available URL: prop > matched card fields
  const resolvedUrl = networkUrl ||
    matchedCard?.network_url ||
    matchedCard?.cg_network_url ||
    matchedCard?.ck_store_url ||
    matchedCard?.card_apply_link ||
    '';

  // Resolve bank name: matched card > prop fallback
  const banks = matchedCard?.banks;
  const resolvedBankName = (Array.isArray(banks) ? banks[0]?.name : banks?.name) ||
    matchedCard?.bank_name ||
    cardName?.split(' ')[0] ||
    'Bank';

  const resolvedBankLogo = (Array.isArray(banks) ? banks[0]?.logo : banks?.logo) ||
    matchedCard?.bank_logo ||
    undefined;

  const resolvedCardId = matchedCard?.id;

  const handleApply = () => {
    // Track analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'eligibility_apply_click', {
        card_alias: cardAlias,
        from_eligibility_check: true
      });
    }

    if (resolvedUrl) {
      openRedirectInterstitial({
        networkUrl: resolvedUrl,
        bankName: resolvedBankName,
        bankLogo: resolvedBankLogo,
        cardName,
        cardId: resolvedCardId,
        cardAlias,
        source: 'eligibility_result'
      });
    }
  };

  const handleViewAlternatives = () => {
    // Track analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'eligibility_alternatives_click', {
        card_alias: cardAlias
      });
    }

    // Navigate to cards listing page with smooth scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
      router.push('/cards');
    }, 300);
  };

  const handleRecheckClick = () => {
    // Track analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'eligibility_recheck', {
        card_alias: cardAlias
      });
    }

    // Call onRecheck directly — do NOT call onOpenChange(false) which would
    // propagate the close up to the parent
    onRecheck();
  };

  // Eligible Result
  if (isEligible) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-full bg-surface-elevated flex items-center justify-center">
                <CheckCircle className="w-7 h-7 text-accent-text" />
              </div>
              <DialogTitle className="text-2xl text-accent-text">
                You're eligible! 🎉
              </DialogTitle>
            </div>
            <DialogDescription>
              You meet the initial eligibility criteria for this card. Click Apply to proceed.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-4">
            <div className="bg-card border border-border rounded-lg p-4">
              <h3 className="font-semibold text-foreground mb-3">Matched Criteria</h3>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-accent-text mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Location:</span> Your pincode is supported
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-accent-text mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Income:</span> Meets minimum requirement
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-accent-text mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Employment:</span> Eligible status
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              onClick={handleApply}
              className="w-full"
              size="lg"
            >
              Apply Now
              <ExternalLink className="ml-2 w-4 h-4" />
            </Button>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleViewAlternatives}
                className="flex-1"
              >
                View Alternatives
              </Button>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Not Eligible Result
  if (hasData) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center">
                <AlertCircle className="w-7 h-7 text-amber-500" />
              </div>
              <DialogTitle className="text-2xl text-foreground">
                Sorry — you're not eligible right now
              </DialogTitle>
            </div>
            <DialogDescription>
              Based on the details you provided, this card isn't a match at the moment.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-4">
            <div className="bg-card border border-border rounded-lg p-4">
              <h3 className="font-semibold text-foreground mb-3">What You Can Do</h3>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    Check if your income meets the card's minimum requirement
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    Verify your pincode is in the serviceable area
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    Explore other cards that match your profile
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              onClick={handleViewAlternatives}
              className="w-full"
              size="lg"
            >
              See Recommended Cards
            </Button>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleRecheckClick}
                className="flex-1"
              >
                Recheck
              </Button>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return null;
}
