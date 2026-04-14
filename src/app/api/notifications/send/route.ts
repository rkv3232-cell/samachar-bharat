import { NextResponse } from "next/server";
import { adminMessaging, adminDb } from "@/lib/firebase-admin";

export async function POST(req: Request) {
    try {
        const { title, body, imageUrl, link, secret } = await req.json();

        // Verify admin secret for security
        if (secret !== process.env.ADMIN_API_SECRET) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (!title || !body) {
            return NextResponse.json({ error: "Title and body are required" }, { status: 400 });
        }

        // Fetch all registered tokens
        const tokensSnapshot = await adminDb.collection("fcm_tokens").get();
        const tokens = tokensSnapshot.docs.map(doc => doc.id);

        if (tokens.length === 0) {
            return NextResponse.json({ success: true, message: "No subscribers found" });
        }

        const message = {
            notification: {
                title,
                body,
                image: imageUrl,
            },
            data: {
                url: link || "/",
            },
            tokens: tokens, // Send to multiple tokens
        };

        const response = await adminMessaging.sendEachForMulticast(message);

        console.log(`${response.successCount} messages were sent successfully`);

        return NextResponse.json({
            success: true,
            message: `${response.successCount} notifications sent`,
            failureCount: response.failureCount,
        });
    } catch (error: any) {
        console.error("FCM Send Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
