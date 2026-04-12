import { getAuthorizedYouTubeClient } from '@/lib/youtube';
import { getPostById } from '@/lib/posts';
import { NextRequest, NextResponse } from 'next/server';
import { Readable } from 'stream';

export async function POST(request: NextRequest) {
    try {
        const { postId, uid } = await request.json();

        if (!postId || !uid) {
            return NextResponse.json({ error: 'Missing postId or uid' }, { status: 400 });
        }

        const { adminDb } = await import('@/lib/firebase-admin');
        const postDoc = await adminDb.collection('posts').doc(postId).get();
        if (!postDoc.exists) {
            return NextResponse.json({ error: 'Post not found' }, { status: 404 });
        }
        const post = postDoc.data();
        if (!post || !post.image) {
            return NextResponse.json({ error: 'Post has no video/media' }, { status: 404 });
        }

        const youtube = await getAuthorizedYouTubeClient(uid);
        if (!youtube) {
            return NextResponse.json({ error: 'YouTube not connected. Please connect first.' }, { status: 401 });
        }

        // Fetch the video file as a stream
        const response = await fetch(post.image);
        if (!response.ok) throw new Error('Failed to fetch video from source');

        // Convert web response to readable stream for googleapis
        const videoStream = Readable.fromWeb(response.body as any);

        const tags = Array.isArray(post.tags) ? post.tags : [];
        const safeContent = post.content ? post.content.replace(/<[^>]*>/g, '').substring(0, 4000) : '';

        const youtubeResponse = await youtube.videos.insert({
            part: ['snippet', 'status'],
            requestBody: {
                snippet: {
                    title: post.title,
                    description: `${safeContent}\n\nRead more: ${process.env.NEXT_PUBLIC_SITE_URL || ''}/post/${post.id}`,
                    tags: tags,
                    categoryId: '25', // News & Politics
                },
                status: {
                    privacyStatus: 'public',
                    selfDeclaredMadeForKids: false,
                },
            },
            media: {
                body: videoStream,
            },
        });

        return NextResponse.json({
            success: true,
            videoId: youtubeResponse.data.id,
            url: `https://www.youtube.com/watch?v=${youtubeResponse.data.id}`
        });

    } catch (error: any) {
        console.error('YouTube Upload Error:', error);
        return NextResponse.json({ error: error.message || 'Upload failed' }, { status: 500 });
    }
}
