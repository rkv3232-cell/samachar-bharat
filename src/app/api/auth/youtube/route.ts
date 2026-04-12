import { youtubeOAuthClient } from '@/lib/youtube';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get('uid');

    if (!uid) {
        return NextResponse.json({ error: 'UID is required' }, { status: 400 });
    }

    const scopes = [
        'https://www.googleapis.com/auth/youtube.upload',
        'https://www.googleapis.com/auth/youtube.readonly'
    ];

    const url = youtubeOAuthClient.generateAuthUrl({
        access_type: 'offline',
        scope: scopes,
        prompt: 'consent',
        state: uid // Send UID to callback via 'state' param
    });

    return NextResponse.redirect(url);
}
