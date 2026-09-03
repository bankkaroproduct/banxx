import { NextRequest, NextResponse } from 'next/server';

/**
 * Partner API base URL.
 *
 * Env-driven so UAT is testable. It was previously hardcoded to production,
 * which made a prod-URL/UAT-key mismatch impossible to rule out and is the most
 * likely cause of the historical 502 on cardgenius/cards.
 */
const PARTNER_BASE_URL =
  process.env.PARTNER_BASE_URL || 'https://platform.bankkaro.com/partner';

async function proxyRequest(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const joinedPath = path.join('/');
  const searchParams = request.nextUrl.searchParams.toString();

  const partnerToken = request.headers.get('partner-token');
  if (!partnerToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'partner-token': partnerToken,
  };

  const init: RequestInit = {
    method: request.method,
    headers,
  };

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    init.body = await request.text();
  }

  const targetUrl = `${PARTNER_BASE_URL}/${joinedPath}${searchParams ? `?${searchParams}` : ''}`;

  try {
    const response = await fetch(targetUrl, init);
    const rawText = await response.text();

    // Upstream errors keep their own status. Collapsing them into 502 (as this
    // route previously did for everything) hid whether the partner API had
    // rejected the request or the request had never arrived.
    if (!response.ok) {
      console.error('[proxy] upstream error', {
        path: joinedPath,
        status: response.status,
        base: PARTNER_BASE_URL,
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
    // A genuine transport failure, distinguishable from an upstream rejection.
    const isAbort = (error as Error)?.name === 'AbortError';
    console.error('[proxy] transport failure', {
      path: joinedPath,
      base: PARTNER_BASE_URL,
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

export const GET = proxyRequest;
export const POST = proxyRequest;
