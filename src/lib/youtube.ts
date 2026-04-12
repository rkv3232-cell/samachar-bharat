import { google } from 'googleapis';
import { db } from './firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

const CLIENT_ID = process.env.YOUTUBE_CLIENT_ID;
const CLIENT_SECRET = process.env.YOUTUBE_CLIENT_SECRET;
const REDIRECT_URI = process.env.YOUTUBE_REDIRECT_URI || 'https://samachar-bharat.netlify.app/api/auth/youtube/callback';

export const youtubeOAuthClient = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URI
);

export async function getYouTubeTokens(userId: string) {
    try {
        const { adminDb } = await import('./firebase-admin');
        const userDoc = await adminDb.collection('users').doc(userId).get();
        if (!userDoc.exists) return null;
        return userDoc.data()?.youtubeTokens || null;
    } catch (error) {
        console.error('[YouTube Lib] getYouTubeTokens Admin Error:', error);
        return null;
    }
}

export async function saveYouTubeTokens(userId: string, tokens: any) {
    console.log('[YouTube Lib] Saving tokens (Admin) for UID:', userId);
    try {
        const { adminDb } = await import('./firebase-admin');
        await adminDb.collection('users').doc(userId).set({
            youtubeTokens: tokens
        }, { merge: true });
        console.log('[YouTube Lib] Tokens saved successfully with Admin SDK');
    } catch (error) {
        console.error('[YouTube Lib] Admin Save Error:', error);
        throw error;
    }
}

export async function getAuthorizedYouTubeClient(userId: string) {
    const tokens = await getYouTubeTokens(userId);
    if (!tokens) return null;

    const oauth2Client = new google.auth.OAuth2(
        CLIENT_ID,
        CLIENT_SECRET,
        REDIRECT_URI
    );

    oauth2Client.setCredentials(tokens);

    // Auto-refresh if expired
    oauth2Client.on('tokens', (newTokens) => {
        if (newTokens.refresh_token) {
            saveYouTubeTokens(userId, { ...tokens, ...newTokens });
        } else {
            saveYouTubeTokens(userId, { ...tokens, ...newTokens, refresh_token: tokens.refresh_token });
        }
    });

    return google.youtube({ version: 'v3', auth: oauth2Client });
}
