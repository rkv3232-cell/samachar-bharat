import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { verifyAdminRequest } from "@/lib/api-auth";
import type { ApiResponse } from "@/types";

export async function DELETE(
    request: NextRequest
): Promise<NextResponse<ApiResponse>> {
    try {
        // 1. Verify admin
        const authResult = await verifyAdminRequest(request);

        if (!authResult.authorized) {
            return NextResponse.json(
                { success: false, message: "Unauthorized", error: authResult.error },
                { status: 401 }
            );
        }

        // 2. Get UID from query params
        const { searchParams } = new URL(request.url);
        const uid = searchParams.get("uid");

        if (!uid || typeof uid !== "string" || uid.trim().length === 0) {
            return NextResponse.json(
                {
                    success: false,
                    message: "User ID (uid) is required as a query parameter",
                },
                { status: 400 }
            );
        }

        // 3. Prevent self-deletion
        if (authResult.uid === uid) {
            return NextResponse.json(
                {
                    success: false,
                    message: "You cannot delete your own account",
                },
                { status: 403 }
            );
        }

        // 4. Check if user exists
        try {
            await adminAuth.getUser(uid);
        } catch (err: any) {
            if (err.code === "auth/user-not-found") {
                // Still try to delete Firestore doc if it exists
                await adminDb.collection("users").doc(uid).delete();
                return NextResponse.json(
                    {
                        success: true,
                        message:
                            "User not found in Auth but Firestore document cleaned up",
                    },
                    { status: 200 }
                );
            }
            throw err;
        }

        // 5. Delete from Firebase Auth
        await adminAuth.deleteUser(uid);

        // 6. Delete from Firestore
        await adminDb.collection("users").doc(uid).delete();

        // 7. (Optional) Delete user's related data
        // Uncomment if you want cascade delete:
        /*
        const commentsSnap = await adminDb
          .collection("comments")
          .where("userId", "==", uid)
          .get();
    
        const batch = adminDb.batch();
        commentsSnap.docs.forEach((doc) => batch.delete(doc.ref));
        await batch.commit();
        */

        return NextResponse.json(
            {
                success: true,
                message: "User deleted successfully from Auth and Firestore",
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error("DELETE USER ERROR:", error);
        return NextResponse.json(
            {
                success: false,
                message: "Failed to delete user",
                error: error.message || "Unknown error",
            },
            { status: 500 }
        );
    }
}
