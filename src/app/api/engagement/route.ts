import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(req: NextRequest) {
    try {
        const { action, postId, userId, isLiking, isBookmarking } = await req.json();

        // 1. Toggle Like
        if (action === 'toggle-like') {
            if (!postId) return NextResponse.json({ error: 'Post ID required' }, { status: 400 });
            const postRef = adminDb.collection('posts').doc(postId);

            if (userId) {
                // Authenticated Like tracking
                const likeRef = adminDb.collection('posts').doc(postId).collection('post_likes').doc(userId);

                if (isLiking) {
                    await likeRef.set({ userId, likedAt: new Date() });
                    await postRef.update({ likes: FieldValue.increment(1) });
                } else {
                    await likeRef.delete();
                    await postRef.update({ likes: FieldValue.increment(-1) });
                }
            } else {
                // Anonymous Like (increment only)
                await postRef.update({ likes: FieldValue.increment(isLiking ? 1 : -1) });
            }
            return NextResponse.json({ success: true });
        }

        // 2. Toggle Bookmark
        if (action === 'toggle-bookmark') {
            if (!postId) return NextResponse.json({ error: 'Post ID required' }, { status: 400 });
            if (!userId) return NextResponse.json({ error: 'Auth required for bookmarks' }, { status: 401 });

            const bookmarkRef = adminDb.collection('users').doc(userId).collection('bookmarks').doc(postId);

            if (isBookmarking) {
                await bookmarkRef.set({ postId, bookmarkedAt: new Date() });
            } else {
                await bookmarkRef.delete();
            }
            return NextResponse.json({ success: true });
        }

        // 3. list bookmarks (Fetch all for a user)
        if (action === 'list-bookmarks') {
            if (!userId) return NextResponse.json({ error: 'Auth required' }, { status: 401 });

            const snaps = await adminDb.collection('users').doc(userId).collection('bookmarks').get();
            const postIds = snaps.docs.map(doc => doc.id);

            if (postIds.length === 0) return NextResponse.json({ posts: [] });

            // Fetch details for each bookmarked post
            const postSnaps = await Promise.all(
                postIds.map(id => adminDb.collection('posts').doc(id).get())
            );

            const posts = postSnaps
                .filter(s => s.exists)
                .map(s => {
                    const data = s.data() || {};
                    // Serialize timestamps for JSON
                    if (data.createdAt && data.createdAt._seconds) {
                        data.createdAt = { seconds: data.createdAt._seconds };
                    }
                    return { id: s.id, ...data };
                });

            return NextResponse.json({ posts });
        }

        // 4. fetch status (Alternative for client-side getDoc failing rules)
        if (action === 'fetch-status') {
            if (!postId) return NextResponse.json({ error: 'Post ID required' }, { status: 400 });
            if (!userId) return NextResponse.json({ hasLiked: false, hasBookmarked: false });

            const likeRef = adminDb.collection('posts').doc(postId).collection('post_likes').doc(userId);
            const bookmarkRef = adminDb.collection('users').doc(userId).collection('bookmarks').doc(postId);

            const [likeSnap, bookmarkSnap] = await Promise.all([
                likeRef.get(),
                bookmarkRef.get()
            ]);

            return NextResponse.json({
                hasLiked: likeSnap.exists,
                hasBookmarked: bookmarkSnap.exists
            });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

    } catch (error: any) {
        console.error('Engagement API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
