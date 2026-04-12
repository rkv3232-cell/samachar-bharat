import { youtubeOAuthClient, saveYouTubeTokens } from '@/lib/youtube';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const uid = searchParams.get('state'); // UID passed back in 'state'

    if (!code || !uid) {
        return NextResponse.redirect(new URL('/admin?error=youtube_auth_failed', request.url));
    }

    try {
        const { tokens } = await youtubeOAuthClient.getToken(code);
        await saveYouTubeTokens(uid, tokens);

        // Redirect back to admin posts or settings
        return NextResponse.redirect(new URL('/admin/posts?success=youtube_connected', request.url));
    } catch (error) {
        console.error('YouTube OAuth Error:', error);
        return NextResponse.redirect(new URL('/admin?error=youtube_token_exchange_failed', request.url));
    }
}
