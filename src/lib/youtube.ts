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
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) return null;
    return userSnap.data().youtubeTokens || null;
}

export async function saveYouTubeTokens(userId: string, tokens: any) {
    console.log('[YouTube Lib] Saving tokens for UID:', userId);
    const { setDoc } = await import('firebase/firestore');
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, {
        youtubeTokens: tokens
    }, { merge: true });
    console.log('[YouTube Lib] Tokens saved successfully');
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
