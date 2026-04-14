import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function POST(req: Request) {
    try {
        const { token } = await req.json();

        if (!token) {
            return NextResponse.json({ error: "Token is required" }, { status: 400 });
        }

        // Save token to 'fcm_tokens' collection
        await adminDb.collection("fcm_tokens").doc(token).set({
            token,
            updatedAt: new Date(),
        });

        return NextResponse.json({ success: true, message: "Token registered successfully" });
    } catch (error: any) {
        console.error("Registration Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
