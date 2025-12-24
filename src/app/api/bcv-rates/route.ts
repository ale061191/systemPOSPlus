import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const res = await fetch('https://bcv-api.rafnixg.dev/rates/', {
            next: { revalidate: 3600 }, // Cache for 1 hour
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
