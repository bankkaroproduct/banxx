"use client";
import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ExternalLink, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { trackApplyRedirect } from '@/services/journeyTrack';

// The exit link is now resolved by the redirect handler BEFORE this page opens —
// the final URL arrives in the `url` param and the exit_id in the `exitId` param.
// This page just runs the countdown and redirects.

const REDIRECT_ANALYTICS_ENABLED = (process.env.NEXT_PUBLIC_ENABLE_REDIRECT_ANALYTICS || '').toString().toLowerCase() === 'true';

interface RedirectState {
  bankName: string;
  bankLogo: string;
  bankDomain: string;
  targetUrl: string;
  cardName: string;
  countdown: number;
  status: 'redirecting' | 'error' | 'blocked';
}

export default function RedirectInterstitial() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [state, setState] = useState<RedirectState>({
    bankName: '',
    bankLogo: '',
    bankDomain: '',
    targetUrl: '',
    cardName: '',
    countdown: 3,
    status: 'redirecting'
  });
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const hasRedirected = useRef(false);

  useEffect(() => {
    // Parse URL parameters
    const bankName = searchParams.get('bank') || 'Bank';
    const bankLogo = searchParams.get('logo') || '';
    const targetUrl = searchParams.get('url') || '';
    const cardName = searchParams.get('card') || '';

    // Validate target URL
    if (!targetUrl || targetUrl === '' || targetUrl === 'null' || targetUrl === 'undefined') {
      setState(prev => ({
        ...prev,
        bankName,
        bankLogo,
        cardName,
        status: 'error'
      }));
      return;
    }

    // Additional HTTPS validation
    try {
      const url = new URL(targetUrl);
      if (url.protocol !== 'https:' && !url.hostname.includes('localhost')) {
        console.error('Non-HTTPS URL detected');
        setState(prev => ({ ...prev, status: 'error' }));
        return;
      }
    } catch (e) {
      console.error('Invalid URL format');
      setState(prev => ({ ...prev, status: 'error' }));
      return;
    }

    // Extract domain from URL
    let bankDomain = '';
    try {
      const urlObj = new URL(targetUrl);
      bankDomain = urlObj.hostname.replace('www.', '');
    } catch {
      bankDomain = 'bank website';
    }

    setState(prev => ({
      ...prev,
      bankName,
      bankLogo,
      bankDomain,
      targetUrl,
      cardName
    }));

    // Start countdown
    let count = 3;
    countdownRef.current = setInterval(() => {
      count -= 1;
      setState(prev => ({ ...prev, countdown: count }));

      if (count <= 0) {
        if (countdownRef.current) clearInterval(countdownRef.current);
        performRedirect(targetUrl);
      }
    }, 1000);

    // Cleanup
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [searchParams]);

  const performRedirect = async (url: string) => {
    if (hasRedirected.current) return;
    hasRedirected.current = true;

    // The exit link was already resolved by the redirect handler before this page
    // opened — `url` is the final destination and `exitId` arrives in the query.
    const finalUrl = url;
    const exitId: string | number | null = searchParams.get('exitId');

    // Journey Track: user is being redirected to the bank's application page,
    // tagged with the exit_id so JT can correlate the exit.
    try {
      trackApplyRedirect(
        searchParams.get('alias') || state.cardName || undefined,
        searchParams.get('source') || undefined,
        exitId ?? undefined
      );
    } catch {
      /* never let tracking block the redirect */
    }

    try {
      // Track event
      if (REDIRECT_ANALYTICS_ENABLED && typeof window !== 'undefined' && navigator.sendBeacon) {
        navigator.sendBeacon('/api/redirect-event', JSON.stringify({
          event: 'redirect_confirm',
          bank: state.bankName,
          card: state.cardName,
          timestamp: Date.now()
        }));
      }

      // Perform redirect — use replace() so the interstitial doesn't stay in history
      // (back button in the new tab won't loop back to the countdown)
      window.location.replace(finalUrl);
    } catch (error) {
      console.error('Redirect failed:', error);
      setState(prev => ({ ...prev, status: 'error' }));
    }
  };

  const handleContinue = () => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    performRedirect(state.targetUrl);
  };

  const handleCancel = () => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    router.back();
  };

  const progressValue = ((3 - state.countdown) / 3) * 100;

  if (state.status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center bg-card rounded-2xl p-8 shadow-lg border">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🏦</span>
          </div>
          <h2 className="text-xl font-bold mb-2">
            Apply for {state.cardName || 'this card'}
          </h2>
          <p className="text-muted-foreground mb-6">
            The direct application link for this card is not available yet. Please visit{' '}
            {state.bankName || 'the bank'}&apos;s official website to apply directly.
          </p>
          <a
            href={`https://www.google.com/search?q=${encodeURIComponent((state.cardName || 'credit card') + ' apply online')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full bg-primary text-primary-foreground rounded-xl py-3 font-semibold mb-3 hover:opacity-90 transition-opacity"
          >
            Search Apply Online →
          </a>
          <Link
            href="/cards"
            className="block w-full border rounded-xl py-3 font-semibold hover:bg-muted/50 transition-colors"
          >
            ← Back to Cards
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background flex items-center justify-center p-4">
      {/* Meta refresh fallback for no-JS users */}
      <noscript>
        <meta httpEquiv="refresh" content={`3;url=${state.targetUrl}`} />
      </noscript>

      <div className="max-w-2xl w-full bg-card rounded-2xl shadow-2xl p-8 md:p-12 text-center animate-fade-in border border-border/50">
        {/* Bank Logo */}
        {state.bankLogo && (
          <div className="mb-6">
            <img
              src={state.bankLogo}
              alt={`${state.bankName} logo`}
              className="h-16 md:h-20 object-contain mx-auto"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        )}

        {/* Main Heading */}
        <h1 className="text-2xl md:text-3xl font-bold mb-3 text-foreground">
          Redirecting you to {state.bankName}
        </h1>

        <p className="text-muted-foreground mb-6">
          You'll be taken to the bank's website to complete your application.
        </p>

        {/* Countdown Display */}
        <div className="mb-8">
          <div className="relative w-32 h-32 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full bg-[#E0F7F9] animate-pulse" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-5xl font-bold text-primary mb-1" role="timer" aria-live="polite">
                  {state.countdown}
                </div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider">
                  seconds
                </div>
              </div>
            </div>
          </div>

          <Progress value={progressValue} className="h-2 mb-3" />

          <p className="text-sm text-muted-foreground" aria-live="polite">
            {state.countdown > 0 ? `Redirecting in ${state.countdown}...` : 'Redirecting now...'}
          </p>
        </div>

        {/* Domain Information */}
        <div className="mb-6 p-4 bg-muted/50 rounded-lg border border-border/50">
          <div className="flex items-center justify-center gap-2 text-sm">
            <CheckCircle2 className="w-4 h-4 text-primary" />
            <span className="text-muted-foreground">Opening:</span>
            <span className="font-semibold text-foreground">{state.bankDomain}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
          <Button
            size="lg"
            onClick={handleContinue}
            className="font-semibold shadow-lg hover:shadow-xl transition-all"
          >
            Continue to {state.bankName}
            <ExternalLink className="w-4 h-4 ml-2" />
          </Button>

          <Button
            variant="outline"
            size="lg"
            onClick={handleCancel}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Cancel & Stay Here
          </Button>
        </div>

        {/* Direct Link Fallback */}
        <div className="mb-6">
          <a
            href={state.targetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline inline-flex items-center gap-1"
          >
            Open bank site (no wait)
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* Footer Disclaimer */}
        <div className="text-xs text-muted-foreground pt-6 border-t border-border/50">
          <p>
            You're leaving our site. We don't send personal data — only a tracking token for analytics.
            <br />
            <a href="https://bankkaro.com/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline ml-1">Privacy Policy</a>
          </p>
          <noscript>
            <p className="mt-4 text-warning">
              JavaScript is disabled. You will be redirected automatically in 3 seconds, or{' '}
              <a href={state.targetUrl} className="text-primary hover:underline font-semibold">click here</a>.
            </p>
          </noscript>
        </div>
      </div>
    </div>
  );
}
