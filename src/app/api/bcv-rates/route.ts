import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const res = await fetch('https://bcv-api.rafnixg.dev/rates/', {
            next: { revalidate: 60 }, // Cache for 60 seconds to avoid rate limits
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'application/json',
                'Referer': 'https://google.com'
            }
        });

        if (!res.ok) {
            throw new Error('Failed to fetch from BCV API');
        }

        const data = await res.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('BCV Proxy Error:', error);
        return NextResponse.json({ error: 'Failed to fetch rates' }, { status: 500 });
    }
}
