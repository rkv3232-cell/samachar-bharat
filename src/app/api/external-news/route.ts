import { NextResponse } from 'next/server';

const API_KEY = process.env.NEWS_API_KEY || '763f2fe124484f03804a360a8bfb0d41';
const BASE_URL = 'https://newsapi.org/v2';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';
    const category = searchParams.get('category') || '';
    const country = searchParams.get('country') || 'in';

    let url = '';

    if (q && !category) {
        url = `${BASE_URL}/everything?apiKey=${API_KEY}&q=${encodeURIComponent(q)}&language=hi`;
    } else {
        url = `${BASE_URL}/top-headlines?apiKey=${API_KEY}&country=${country}`;
        if (category) {
            url += `&category=${category}`;
        }
        if (q) {
            url += `&q=${encodeURIComponent(q)}`;
        }
    }

    try {
        const res = await fetch(url, {
            signal: AbortSignal.timeout(4000),
            next: { revalidate: 300 }
        });
        const data = await res.json();

        if (!res.ok) {
            console.warn('NewsAPI Error (returning fallback):', data?.message);
            return NextResponse.json({ status: 'ok', totalResults: 0, articles: [] });
        }

        return NextResponse.json(data, {
            headers: {
                'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
            }
        });
    } catch (error: any) {
        console.warn('Failed to fetch from NewsAPI (fallback applied):', error?.message);
        return NextResponse.json({ status: 'ok', totalResults: 0, articles: [] });
    }
}
