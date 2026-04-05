import { NextResponse } from 'next/server';
import { fetchRssFeeds } from '@/lib/rssParser';
import { adminDb } from '@/lib/firebase-admin';

// This is the cron job endpoint (Vercel Cron / external trigger)
export const maxDuration = 60; // Max execution time for Vercel functions

export async function GET(req: Request) {
    try {
        // Optional: Secure this endpoint with a Cron Secret in production
        const authHeader = req.headers.get('authorization');
        if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const articles = await fetchRssFeeds();
        if (!articles || articles.length === 0) {
            return NextResponse.json({ success: true, count: 0, message: 'No articles found' });
        }

        const batch = adminDb.batch();
        const newsRef = adminDb.collection('rss_news');

        let addedCount = 0;

        // Firestore batch max limits to 500 operations
        for (const article of articles) {
            // Generate a Safe ID using base64 of the URL
            const docId = Buffer.from(article.url || Math.random().toString())
                .toString('base64')
                .replace(/[^a-zA-Z0-9]/g, '')
                .substring(0, 100); // Prevent extremely long IDs

            const docRef = newsRef.doc(docId);

            batch.set(docRef, {
                ...article,
                category: article.category || 'general',
                publishedAt: new Date(article.publishedAt),
                fetchedAt: new Date() // For internal auditing
            }, { merge: true });

            addedCount++;
            if (addedCount >= 400) break; // Keep under 500 limit just in case
        }

        if (addedCount > 0) {
            await batch.commit();
        }

        // Ideally, here you would also write code to delete articles older than 1 month
        // to keep DB size constrained, e.g., fetching old ones and deleting in a batch.

        return NextResponse.json({
            success: true,
            count: addedCount,
            message: 'News synced to Firestore successfully'
        });
    } catch (error: any) {
        console.error('Cron Fetch Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
