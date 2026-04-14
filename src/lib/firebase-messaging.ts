import { getMessaging, getToken, onMessage } from "firebase/messaging";
import app from "./firebase.js";

const messaging = typeof window !== "undefined" ? getMessaging(app) : null;

export const requestForToken = async () => {
    if (!messaging) return null;

    try {
        const permission = await Notification.requestPermission();
        if (permission === "granted") {
            const currentToken = await getToken(messaging, {
                vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
            });
            if (currentToken) {
                console.log("FCM Token:", currentToken);
                // Save this token to your database
                await saveTokenToDatabase(currentToken);
                return currentToken;
            } else {
                console.log("No registration token available. Request permission to generate one.");
            }
        }
    } catch (err) {
        console.error("An error occurred while retrieving token. ", err);
    }
    return null;
};

const saveTokenToDatabase = async (token: string) => {
    try {
        await fetch("/api/notifications/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token }),
        });
    } catch (err) {
        console.error("Failed to save FCM token:", err);
    }
};

export const onMessageListener = () =>
    new Promise((resolve) => {
        if (!messaging) return;
        onMessage(messaging, (payload) => {
            console.log("Foreground message received:", payload);
            resolve(payload);
        });
    });
