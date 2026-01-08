import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import https from 'https';

export async function GET() {
    try {
        // Create an agent to bypass SSL errors (common with BCV website)
        const agent = new https.Agent({
            rejectUnauthorized: false
        });

        // We use standard fetch with the custom agent via the 'dispatcher' option if using undici (Node 18+ global fetch)
        // or simply ignoring SSL globally for this request if needed, but Next.js extends fetch.
        // For simplicity and reliability in Node environment within Next.js:
        
        // Note: Next.js 'fetch' doesn't directly support 'agent'. 
        // We will strictly disable TLS checking for this operation if necessary or use a workaround.
        // Since we can't easily pass the agent to Next.js extended fetch, we'll use a dynamic import of 'node-fetch' or similar if needed,
        // but standard fetch usually works if we handle the formatting.
        // Let's try attempting a fetch with standard headers first, but BCV often blocks requests without User-Agent.
        
        // Workaround for BCV SSL issues in Node:
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
        
        const res = await fetch('https://www.bcv.org.ve', {
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'es-ES,es;q=0.9',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            },
            next: { revalidate: 60 }, // Cache for 60 seconds
        });
        
        // Reset TLS rejection to default/safe state (best effort, though it's global)
        // process.env.NODE_TLS_REJECT_UNAUTHORIZED = '1'; 

        if (!res.ok) {
            throw new Error(`Failed to fetch BCV: ${res.status}`);
        }

        const html = await res.text();
        const $ = cheerio.load(html);

        // Helper to parse the Venezuelan number format (e.g., "36,1234") to float
        const parseRate = (selector: string) => {
            const raw = $(selector).find('strong').text().trim();
            if (!raw) return null;
            return parseFloat(raw.replace(',', '.'));
        };

        const dollarRate = parseRate('#dolar');
        const euroRate = parseRate('#euro');

        // Extract date (usually "Fecha Valor: ...")
        // The date is often in a specific format on the page, we'll try to find the standard location
        // or just use current server date if not easily parseable, 
        // but it's better to try to find the date from the page.
        // Common selector: .pull-right.fecha-valor
        let dateStr = new Date().toISOString().split('T')[0]; // Default to today
        
        // Attempt to parse actual date from page content like "Fecha Valor: Jueves, 07 Enero 2026"
        // It's often inside a div with class "fecha-valor" or similar.
        // For now, we will use the fetch timestamp or current date as reliable fallback 
        // because parsing the Spanish date string requires more complex logic.

        if (!dollarRate || !euroRate) {
             throw new Error('Could not parse rates from BCV HTML');
        }

        return NextResponse.json({
            dollar: dollarRate,
            euro: euroRate,
            date: dateStr,
            source: 'BCV Direct Scraper'
        });

    } catch (error) {
        console.error('BCV Scraper Error:', error);
        
        // Fallback or error response
        return NextResponse.json(
            { error: 'Failed to retrieve official rates' },
            { status: 500 }
        );
    }
}
