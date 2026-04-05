import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifyAdminRequest } from "@/lib/api-auth";
import type { ApiResponse, UserRole } from "@/types";

const OWNER_EMAIL = "rkv3232@gmail.com";

export async function POST(
    request: NextRequest
): Promise<NextResponse<ApiResponse<null>>> {
    try {
        // 1. Verify admin/owner
        const authResult = await verifyAdminRequest(request);

        if (!authResult.authorized) {
            return NextResponse.json(
                { success: false, message: "Unauthorized", error: authResult.error },
                { status: 401 }
            );
        }

        // 2. Parse request body
        const { uid, role } = await request.json();

        if (!uid || !role) {
            return NextResponse.json(
                { success: false, message: "Missing uid or role in request body" },
                { status: 400 }
            );
        }

        // 3. Prevent changing role of the primary owner
        const userRef = adminDb.collection("users").doc(uid);
        const userSnap = await userRef.get();

        if (!userSnap.exists) {
            return NextResponse.json(
                { success: false, message: "User not found" },
                { status: 404 }
            );
        }

        const userData = userSnap.data();
        if (userData?.email === OWNER_EMAIL && role !== "owner") {
            return NextResponse.json(
                { success: false, message: "Cannot downgrade the primary owner account" },
                { status: 403 }
            );
        }

        // 4. Update the role in Firestore
        await userRef.update({
            role: role as UserRole,
            updatedAt: new Date().toISOString()
        });

        // Optional: Update custom claims if using them
        // await adminAuth.setCustomUserClaims(uid, { role });

        return NextResponse.json(
            {
                success: true,
                message: `User role updated to ${role}`,
                data: null
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error("UPDATE USER ROLE ERROR:", error);
        return NextResponse.json(
            {
                success: false,
                message: "Failed to update user role",
                error: error.message,
            },
            { status: 500 }
        );
    }
}
