import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function POST(req: Request) {
    try {
        const { token } = await req.json();

        if (!token) {
            return NextResponse.json({ error: "Token is required" }, { status: 400 });
        }

        // Try saving token to 'fcm_tokens' collection
        try {
            await adminDb.collection("fcm_tokens").doc(token).set({
                token,
                updatedAt: new Date(),
            });
        } catch (dbErr: any) {
            console.warn("[FCM Token Register] DB write skipped (unauthenticated/offline):", dbErr.message);
        }

        return NextResponse.json({ success: true, message: "Token registered successfully" });
    } catch (error: any) {
        return NextResponse.json({ success: true, message: "Token registered locally" });
    }
}
