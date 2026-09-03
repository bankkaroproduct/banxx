import { NextRequest, NextResponse } from 'next/server';

const JT_BASE_URL = process.env.JT_API_URL || process.env.NEXT_PUBLIC_JT_API_URL || 'https://bk-sbi-journey.bankkaro.com/JT/api';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const partnerToken = req.headers.get('partner-token') || '';

        // Forward to JT service server-to-server (no CORS)
        fetch(`${JT_BASE_URL}/push?type=PARTNER_JOURNEY_TRACK`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'partner-token': partnerToken,
            },
            body: JSON.stringify(body),
        }).catch(() => { /* silent */ });

        return NextResponse.json({ success: 1 });
    } catch {
        return NextResponse.json({ success: 1 });
    }
}
