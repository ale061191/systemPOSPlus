import { NextResponse } from 'next/server';

export async function GET() {
    try {
        // Primary API
        try {
            const res = await fetch('https://bcv-api.rafnixg.dev/rates/', {
                next: { revalidate: 60 },
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                    'Accept': 'application/json'
                }
            });
            if (res.ok) {
                const data = await res.json();
                return NextResponse.json(data);
            }
            console.warn("Primary API failed:", res.status);
        } catch (e) {
            console.warn("Primary API error:", e);
        }

        // Backup API (ve.dolarapi.com)
        try {
            console.log("Using backup API...");
            const res = await fetch('https://ve.dolarapi.com/v1/dolares/oficial', {
                next: { revalidate: 60 },
                headers: { 'Accept': 'application/json' }
            });

            if (res.ok) {
                const data = await res.json();
                // Map the response format { promedio: 123.45 } to our format { dollar: 123.45 }
                if (data && data.promedio) {
                    return NextResponse.json({
                        dollar: data.promedio,
                        date: data.fechaActualizacion
                    });
                }
            }
        } catch (e) {
            console.error("Backup API error:", e);
        }

        return NextResponse.json({ error: 'Failed to fetch rates from all sources' }, { status: 500 });
    } catch (error) {
        console.error('BCV Proxy Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
