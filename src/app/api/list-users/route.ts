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

        // 2. Fetch all users from Firestore ordered by creation date
        const snapshot = await adminDb
            .collection("users")
            .orderBy("createdAt", "desc")
            .get();

        const users: UserDocument[] = snapshot.docs.map(
            (doc) => ({ uid: doc.id, ...doc.data() } as UserDocument)
        );

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
