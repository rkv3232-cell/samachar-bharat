import { NextResponse } from 'next/server';

const API_KEY = '763f2fe124484f03804a360a8bfb0d41';
const BASE_URL = 'https://newsapi.org/v2';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';
    const category = searchParams.get('category') || '';
    const country = searchParams.get('country') || 'in';

    // NewsAPI Logic: 
    // If there is a search query without a category, we can search all articles (everything).
    // If it's just browsing, use top-headlines.
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
        const res = await fetch(url);
        const data = await res.json();

        if (!res.ok) {
            console.error('NewsAPI Error:', data);
            return NextResponse.json({ error: data.message || 'Failed to fetch news' }, { status: res.status });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Failed to fetch from NewsAPI', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
