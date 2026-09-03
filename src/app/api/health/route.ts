import { NextResponse } from 'next/server';
import { ALLOWED_ORIGINS, normalizeOrigin } from '@/lib/allowedOrigins';

/**
 * Deployment config check.
 *
 * Exists because the two failures that have historically killed a whitelabel
 * deployment both present as a blank app rather than as an error:
 *
 *   - NEXT_PUBLIC_APP_URL unset, or set with a trailing slash, so it does not
 *     match the /api/token origin allowlist and every token request 403s.
 *   - PARTNER_API_KEY unset, so the token route 500s.
 *
 * Reports booleans and the resolved origin only. It never returns the API key
 * or any part of it.
 */
export async function GET() {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? null;
    const normalizedAppUrl = normalizeOrigin(appUrl);

    const checks = {
        partnerApiKeyConfigured: Boolean(process.env.PARTNER_API_KEY),
        partnerTokenUrl: process.env.PARTNER_TOKEN_URL || 'https://platform.bankkaro.com/partner/token',
        partnerBaseUrl: process.env.PARTNER_BASE_URL || 'https://platform.bankkaro.com/partner',
        appUrlConfigured: Boolean(appUrl),
        appUrlRaw: appUrl,
        appUrlNormalized: normalizedAppUrl,
        // The check that matters: does the configured app URL actually appear
        // in the allowlist after normalisation?
        appUrlInAllowedOrigins: Boolean(normalizedAppUrl && ALLOWED_ORIGINS.includes(normalizedAppUrl)),
        appUrlHasTrailingSlash: Boolean(appUrl && appUrl !== appUrl.replace(/\/+$/, '')),
        allowedOrigins: ALLOWED_ORIGINS,
    };

    const problems: string[] = [];
    if (!checks.partnerApiKeyConfigured) {
        problems.push('PARTNER_API_KEY is not set: /api/token will return 500 and no card data will load.');
    }
    if (!checks.appUrlConfigured) {
        problems.push('NEXT_PUBLIC_APP_URL is not set: /api/token will 403 in production and the app will render blank.');
    } else if (!checks.appUrlInAllowedOrigins) {
        problems.push(
            `NEXT_PUBLIC_APP_URL (${appUrl}) does not match any allowed origin. ` +
            'Set it to exactly https://banxx.bankkaro.com with no trailing slash.'
        );
    }
    if (checks.appUrlHasTrailingSlash) {
        problems.push('NEXT_PUBLIC_APP_URL has a trailing slash. It is tolerated by normalisation but should be removed.');
    }

    return NextResponse.json(
        { ok: problems.length === 0, problems, checks },
        { status: problems.length === 0 ? 200 : 503 }
    );
}
