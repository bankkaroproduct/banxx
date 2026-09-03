import { NextRequest, NextResponse } from 'next/server';

/**
 * Server-side proxy for the eligibility check.
 *
 * The eligibility API lives on a DIFFERENT host from the partner API
 * (bk-prod-external.bankkaro.com, not platform.bankkaro.com/partner) and takes
 * no partner-token. Calling it straight from the browser fails CORS on every
 * origin the endpoint does not explicitly allow — including http://localhost
 * during local development, where it surfaces as a "Load failed" / "Failed to
 * fetch" TypeError and the eligibility filter silently never applies.
 *
 * Routing it through Next removes the browser-origin dependency entirely: the
 * request is same-origin to /api/eligibility and the server-to-server hop has
 * no CORS. This mirrors the /api/proxy pattern already used for the partner API.
 *
 * Env-driven base so UAT is testable, same rationale as PARTNER_BASE_URL.
 */
const ELIGIBILITY_URL =
  process.env.ELIGIBILITY_URL ||
  'https://bk-prod-external.bankkaro.com/sp/api/cg-eligiblity';

export async function POST(request: NextRequest) {
  const body = await request.text();

  try {
    const response = await fetch(ELIGIBILITY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });
    const rawText = await response.text();

    if (!response.ok) {
      console.error('[eligibility] upstream error', {
        status: response.status,
        base: ELIGIBILITY_URL,
      });
    }

    let data: unknown;
    try {
      data = JSON.parse(rawText);
    } catch {
      data = { _raw: rawText };
    }
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    const isAbort = (error as Error)?.name === 'AbortError';
    console.error('[eligibility] transport failure', {
      base: ELIGIBILITY_URL,
      reason: isAbort ? 'timeout' : (error as Error)?.message,
    });
    return NextResponse.json(
      {
        error: isAbort ? 'Upstream timeout' : 'Upstream unreachable',
        code: isAbort ? 'UPSTREAM_TIMEOUT' : 'UPSTREAM_UNREACHABLE',
      },
      { status: isAbort ? 504 : 502 }
    );
  }
}
