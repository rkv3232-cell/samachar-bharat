import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const limitParam = parseInt(searchParams.get('limit') || '50', 10);
    // Ensure limit doesn't blow up DB reads
    const limit = Math.min(limitParam, 100);
    const source = searchParams.get('source') || '';
    const q = searchParams.get('q') || '';
    const category = searchParams.get('category') || '';

    // Pagination (using Firebase limits or offset, but typically offset is expensive in Firestore). 
    // We'll use simple limit for now. Production pagination via cursor can be added later.

    try {
        let query: any = adminDb.collection('rss_news').orderBy('publishedAt', 'desc');

        if (source) {
            query = query.where('source', '==', source);
        }

        const snapshot = await query.limit(limit).get();
        let articles = snapshot.docs.map((doc: any) => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                // Ensure correct ISO string
                publishedAt: data.publishedAt?.toDate ? data.publishedAt.toDate().toISOString() : data.publishedAt
            };
        });

        // Filter by category in-memory for now to avoid Firestore Index requirement crashes
        if (category && category !== 'general') {
            articles = articles.filter((a: any) => a.category === category);
        }

        // Basic Text Search implementation
        // Firestore doesn't support full-text search natively without extensions (Algolia/Typesense)
        // Here we just filter in memory since we are dealing with max 100 items for this simple robust build
        if (q) {
            const lowerQ = q.toLowerCase();
            articles = articles.filter((a: any) =>
                (a.title || '').toLowerCase().includes(lowerQ) ||
                (a.description || '').toLowerCase().includes(lowerQ)
            );
        }

        return NextResponse.json(
            { articles, count: articles.length },
            {
                headers: {
                    // Caching for high traffic: Set Vercel/CDN max-age to 5 minutes, stale-while-revalidate 10 minutes
                    'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
                }
            }
        );
    } catch (error: any) {
        console.error('API /news GET Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
