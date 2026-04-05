import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { verifyAdminRequest } from "@/lib/api-auth";
import type { CreateUserPayload, ApiResponse, UserDocument } from "@/types";

// ─── Input Validation ───

function validatePayload(body: any): {
    valid: boolean;
    error?: string;
    data?: CreateUserPayload;
} {
    const { name, email, password, role } = body;

    if (!name || typeof name !== "string" || name.trim().length < 2) {
        return { valid: false, error: "Name must be at least 2 characters long" };
    }

    if (!email || typeof email !== "string") {
        return { valid: false, error: "Valid email is required" };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return { valid: false, error: "Invalid email format" };
    }

    if (!password || typeof password !== "string" || password.length < 6) {
        return {
            valid: false,
            error: "Password must be at least 6 characters long",
        };
    }

    if (password.length > 128) {
        return { valid: false, error: "Password is too long (max 128 characters)" };
    }

    const validRoles = ["admin", "reporter", "user"];
    if (!role || !validRoles.includes(role)) {
        return {
            valid: false,
            error: `Role must be one of: ${validRoles.join(", ")}`,
        };
    }

    return {
        valid: true,
        data: {
            name: name.trim(),
            email: email.trim().toLowerCase(),
            password,
            role,
        },
    };
}

// ─── POST Handler ───

export async function POST(
    request: NextRequest
): Promise<NextResponse<ApiResponse<UserDocument>>> {
    try {
        // 1. Verify admin access
        const authResult = await verifyAdminRequest(request);

        if (!authResult.authorized) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Unauthorized",
                    error: authResult.error,
                },
                { status: 401 }
            );
        }

        // 2. Parse and validate body
        let body: any;
        try {
            body = await request.json();
        } catch {
            return NextResponse.json(
                {
                    success: false,
                    message: "Invalid JSON body",
                    error: "Request body must be valid JSON",
                },
                { status: 400 }
            );
        }

        const validation = validatePayload(body);

        if (!validation.valid || !validation.data) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Validation failed",
                    error: validation.error,
                },
                { status: 400 }
            );
        }

        const { name, email, password, role } = validation.data;

        // 3. Check if email already exists in Auth
        try {
            await adminAuth.getUserByEmail(email);
            // If we get here, user exists
            return NextResponse.json(
                {
                    success: false,
                    message: "User already exists",
                    error: `A user with email "${email}" already exists in Firebase Auth`,
                },
                { status: 409 }
            );
        } catch (err: any) {
            // auth/user-not-found is expected — means we can proceed
            if (err.code !== "auth/user-not-found") {
                throw err;
            }
        }

        // 4. Create user in Firebase Auth
        const userRecord = await adminAuth.createUser({
            email,
            password,
            displayName: name,
            emailVerified: false,
            disabled: false,
        });

        const uid = userRecord.uid;

        // 5. Set custom claims for role
        await adminAuth.setCustomUserClaims(uid, { role });

        // 6. Save user document in Firestore
        const now = new Date().toISOString();
        const userDocument: UserDocument = {
            uid,
            name,
            email,
            role,
            createdAt: now,
            status: "active",
        };

        await adminDb.collection("users").doc(uid).set(userDocument);

        // 7. Return success
        return NextResponse.json(
            {
                success: true,
                message: `User "${name}" created successfully with role "${role}"`,
                data: userDocument,
            },
            { status: 201 }
        );
    } catch (error: any) {
        console.error("CREATE USER ERROR:", error);

        // Handle specific Firebase errors
        const firebaseErrors: Record<string, { status: number; message: string }> =
        {
            "auth/email-already-exists": {
                status: 409,
                message: "This email is already registered",
            },
            "auth/invalid-email": {
                status: 400,
                message: "The email address is invalid",
            },
            "auth/invalid-password": {
                status: 400,
                message: "Password must be at least 6 characters",
            },
            "auth/operation-not-allowed": {
                status: 403,
                message: "Email/password accounts are not enabled in Firebase",
            },
        };

        const knownError = firebaseErrors[error.code];

        if (knownError) {
            return NextResponse.json(
                {
                    success: false,
                    message: knownError.message,
                    error: error.code,
                },
                { status: knownError.status }
            );
        }

        return NextResponse.json(
            {
                success: false,
                message: "Internal server error while creating user",
                error: error.message || "Unknown error",
            },
            { status: 500 }
        );
    }
}
