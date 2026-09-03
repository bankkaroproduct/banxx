import { NextRequest, NextResponse } from 'next/server';

// NOTE: This is a basic development-only rate limiter.
// For production, replace with a proper solution such as:
//   - Vercel Edge Rate Limiting (via middleware)
//   - Upstash Redis rate limiting (@upstash/ratelimit)
//   - nginx / CDN-level rate limiting
// The current Map-based implementation resets on every server restart
// and does not work across multiple server instances.
declare global {
    // eslint-disable-next-line no-var
    var rateLimitMap: Map<string, number[]> | undefined;
}

const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10;

const ALLOWED_ORIGINS = [
    process.env.NEXT_PUBLIC_APP_URL,
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'https://bankkaro.com',
    'https://niraj-dugar-partner.vercel.app',
    'https://niraj-dugar-partner-bankkaroproducts-projects.vercel.app',
].filter(Boolean) as string[];

export async function POST(request: NextRequest) {
    // --- CSRF origin check (production only) ---
    if (process.env.NODE_ENV === 'production') {
        const origin = request.headers.get('origin');
        const referer = request.headers.get('referer');
        const requestOrigin = origin ?? (referer ? (() => { try { return new URL(referer).origin; } catch { return null; } })() : null);

        if (!requestOrigin || !ALLOWED_ORIGINS.some(o => requestOrigin === o)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
    }
    // --- end CSRF check ---

    // --- IP-based rate limiting ---
    const ip =
        request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
        request.headers.get('x-real-ip') ||
        'unknown';

    const now = Date.now();
    if (!global.rateLimitMap) global.rateLimitMap = new Map();

    const recent = (global.rateLimitMap.get(ip) || []).filter(
        (t) => now - t < RATE_LIMIT_WINDOW_MS
    );

    if (recent.length >= RATE_LIMIT_MAX_REQUESTS) {
        return NextResponse.json(
            { error: 'Too many requests. Please try again later.' },
            { status: 429 }
        );
    }

    global.rateLimitMap.set(ip, [...recent, now]);
    // --- end rate limiting ---

    const apiKey = process.env.PARTNER_API_KEY;
    const tokenUrl = process.env.PARTNER_TOKEN_URL || 'https://platform.bankkaro.com/partner/token';

    if (!apiKey) {
        console.error('PARTNER_API_KEY is not defined in environment variables');
        return NextResponse.json(
            { status: 'error', message: 'Server configuration error' },
            { status: 500 }
        );
    }

    try {
        const apiResponse = await fetch(tokenUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 'x-api-key': apiKey.trim() }),
        });

        if (!apiResponse.ok) {
            // Log internally but never forward partner error details to the client
            const errorData = await apiResponse.json().catch(() => ({}));
            console.error('Token proxy: partner returned error', apiResponse.status, errorData);
            return NextResponse.json(
                { status: 'error', message: 'Failed to fetch auth token' },
                { status: apiResponse.status }
            );
        }

        const data = await apiResponse.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Token proxy error:', error);
        return NextResponse.json(
            { status: 'error', message: 'Internal server error' },
            { status: 500 }
        );
    }
}
