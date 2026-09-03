import { NextRequest, NextResponse } from 'next/server';

const PARTNER_BASE_URL = 'https://platform.bankkaro.com/partner';

async function proxyRequest(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const joinedPath = path.join('/');
  const searchParams = request.nextUrl.searchParams.toString();

  // All paths: forward to the partner API with JWT auth
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
  console.log(`[proxy] ${request.method} ${joinedPath} → ${targetUrl}`);

  try {
    const response = await fetch(targetUrl, init);
    const rawText = await response.text();
    console.log(`[proxy] upstream ${response.status} for ${joinedPath}:`, rawText);
    let data: unknown;
    try { data = JSON.parse(rawText); } catch { data = { _raw: rawText }; }
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Partner API proxy error:', error);
    return NextResponse.json({ error: 'Proxy error' }, { status: 502 });
  }
}

export const GET = proxyRequest;
export const POST = proxyRequest;
