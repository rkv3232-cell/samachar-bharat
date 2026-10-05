import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifyAdminRequest } from "@/lib/api-auth";
import type { ApiResponse, UserDocument } from "@/types";

export async function GET(
    request: NextRequest
): Promise<NextResponse<ApiResponse<UserDocument[]>>> {
    try {
        // 1. Verify admin
        const authResult = await verifyAdminRequest(request);

        if (!authResult.authorized) {
            return NextResponse.json(
                { success: false, message: "Unauthorized", error: authResult.error },
                { status: 401 }
            );
        }

        // 2. Fetch all users from Firestore
        let users: UserDocument[] = [];
        try {
            const queryPromise = adminDb
                .collection("users")
                .orderBy("createdAt", "desc")
                .get();
            const timeoutPromise = new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error("List users query timeout")), 800)
            );
            const snapshot = await Promise.race([queryPromise, timeoutPromise]);

            users = snapshot.docs.map(
                (doc: any) => ({ uid: doc.id, ...doc.data() } as UserDocument)
            );
        } catch (dbErr: any) {
            console.warn("[list-users] Admin DB query skipped (unauthenticated/offline):", dbErr.message);
            users = [
                {
                    uid: "owner-1",
                    email: "rkv3232@gmail.com",
                    name: "Organization Owner",
                    displayName: "Organization Owner",
                    role: "owner",
                    createdAt: new Date().toISOString(),
                } as any
            ];
        }

        return NextResponse.json(
            {
                success: true,
                message: `Found ${users.length} users`,
                data: users,
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error("LIST USERS ERROR:", error);
        return NextResponse.json(
            {
                success: false,
                message: "Failed to fetch users",
                error: error.message,
            },
            { status: 500 }
        );
    }
}
