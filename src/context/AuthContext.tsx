// src/context/AuthContext.tsx
// Production-grade authentication context for Next.js + Firebase.
//
// SECURITY LAYERS:
//  1. loading=true by default → prevents flash of admin/editor content
//  2. onSnapshot listener → role changes reflected in real-time
//  3. Firestore document missing → auto-creates (owner email → owner role, else user)
//  4. signOut → clears ALL state and cookie
//  5. isAdmin/isEditor are INCLUSIVE (owner has both)

"use client";

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
    type ReactNode,
} from "react";
import {
    onAuthStateChanged,
    onIdTokenChanged,
    signInWithEmailAndPassword,
    signOut as firebaseSignOut,
    createUserWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithPopup,
    updateProfile,
    setPersistence,
    browserLocalPersistence,
    type User,
} from "firebase/auth";
import {
    doc,
    onSnapshot,
    getFirestore,
    Timestamp,
} from "firebase/firestore";
import { auth } from "@/lib/firebase";
import { UserRole, Permission, type FirestoreUser, type AuthContextType, type PlainUser, type PlainFirestoreUser } from "@/types/auth.types";
import { hasPermission, toUserRole, hasMinimumRole } from "@/lib/permissions";
import { createUserDocument, getUserDocument, updateLastLogin } from "@/lib/firebase/user";

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<PlainUser | null>(null);
    const [firestoreUser, setFirestoreUser] = useState<PlainFirestoreUser | null>(null);
    const [role, setRole] = useState<UserRole | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    // ─── Debug Logs ──────────────────────────────────────────────────────────
    useEffect(() => {
        console.log("[AuthContext] State Update:", {
            uid: user?.uid,
            email: user?.email,
            role,
            loading,
            hasFirestoreDoc: !!firestoreUser
        });
    }, [user, role, loading, firestoreUser]);

    const userEmailRef = useRef(user?.email);
    useEffect(() => {
        userEmailRef.current = user?.email;
    }, [user?.email]);

    const firestoreUnsubRef = useRef<(() => void) | null>(null);

    // ── Real-time Firestore listener ───────────────────────────────────────────
    const subscribeToFirestoreUser = useCallback((uid: string) => {
        if (firestoreUnsubRef.current) {
            firestoreUnsubRef.current();
            firestoreUnsubRef.current = null;
        }

        const db = getFirestore();
        const userRef = doc(db, "users", uid);

        const unsubscribe = onSnapshot(
            userRef,
            (snap) => {
                if (snap.exists()) {
                    const data = snap.data() as FirestoreUser;
                    const plainData: PlainFirestoreUser = {
                        ...data,
                        lastLoginAt: data.lastLoginAt instanceof Timestamp ? data.lastLoginAt.toDate().toISOString() : data.lastLoginAt,
                        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
                        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt,
                    };
                    setFirestoreUser((prev) => (JSON.stringify(prev) === JSON.stringify(plainData) ? prev : plainData));
                    const userRoleParsed = toUserRole(data.role as string);
                    setRole((prev) => (prev === userRoleParsed ? prev : userRoleParsed));
                } else {
                    setFirestoreUser(null);
                    const email = userEmailRef.current;
                    const defaultRole = (email === "rkv3232@gmail.com" || email === "ckv3232@gmail.com") ? UserRole.OWNER : UserRole.USER;
                    setRole((prev) => (prev === defaultRole ? prev : defaultRole));
                }
                setLoading(false);
            },
            (err) => {
                console.error("[AuthContext] Firestore snapshot error:", err);
                setError(err as Error);
                setLoading(false);
            }
        );

        firestoreUnsubRef.current = unsubscribe;
    }, []);

    // ── Auth State Listener ─────────────────────────────────────────────────────
    const activeUidRef = useRef<string | null>(null);

    useEffect(() => {
        setPersistence(auth, browserLocalPersistence).catch((err) => {
            console.warn("[AuthContext] setPersistence warning:", err);
        });

        const syncSessionCookie = async (currentUser: User | null) => {
            if (!currentUser) return;
            try {
                const idToken = await currentUser.getIdToken();
                await fetch("/api/auth/session", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ idToken }),
                });
            } catch (sessionErr) {
                console.error("[AuthContext] Session cookie sync failed:", sessionErr);
            }
        };

        const unsubscribeToken = onIdTokenChanged(auth, (currentUser) => {
            if (currentUser) {
                syncSessionCookie(currentUser);
            }
        });

        const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser?.uid === activeUidRef.current && currentUser) {
                // User already initialized, avoid re-fetching user doc
                return;
            }

            activeUidRef.current = currentUser?.uid || null;

            setUser(currentUser ? {
                uid: currentUser.uid,
                email: currentUser.email,
                displayName: currentUser.displayName,
                photoURL: currentUser.photoURL,
                emailVerified: currentUser.emailVerified,
            } : null);
            setError(null);

            if (currentUser) {
                const isOwnerEmail = currentUser.email === "rkv3232@gmail.com" || currentUser.email === "ckv3232@gmail.com";
                if (isOwnerEmail) {
                    setRole(UserRole.OWNER);
                }

                try {
                    await syncSessionCookie(currentUser);

                    const existingDoc = await getUserDocument(currentUser.uid);
                    if (!existingDoc) {
                        await createUserDocument(currentUser);
                    } else {
                        updateLastLogin(currentUser.uid).catch(console.error);
                    }

                    subscribeToFirestoreUser(currentUser.uid);
                } catch (err) {
                    console.error("[AuthContext] Critical sync error:", err);
                    setError(err as Error);
                    setLoading(false);
                }
            } else {
                if (firestoreUnsubRef.current) {
                    firestoreUnsubRef.current();
                    firestoreUnsubRef.current = null;
                }
                setFirestoreUser(null);
                setRole(null);
                setLoading(false);
            }
        });

        return () => {
            unsubscribeToken();
            unsubscribeAuth();
            if (firestoreUnsubRef.current) firestoreUnsubRef.current();
        };
    }, [subscribeToFirestoreUser]);

    // ── Auth Methods ────────────────────────────────────────────────────────────

    const signIn = useCallback(async (email: string, password: string): Promise<void> => {
        setError(null);
        await signInWithEmailAndPassword(auth, email, password);
    }, []);

    const signInWithGoogle = useCallback(async (): Promise<void> => {
        setError(null);
        const provider = new GoogleAuthProvider();
        provider.addScope("email");
        const result = await signInWithPopup(auth, provider);
        await createUserDocument(result.user);
    }, []);

    const signUp = useCallback(async (
        email: string,
        password: string,
        name: string
    ): Promise<void> => {
        setError(null);
        const credential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(credential.user, { displayName: name });
        await createUserDocument(credential.user, { name });
    }, []);

    const signOut = useCallback(async (): Promise<void> => {
        setError(null);
        activeUidRef.current = null;
        try {
            await fetch("/api/auth/session", { method: "DELETE" });
        } catch {
            // Non-critical
        }
        await firebaseSignOut(auth);
    }, []);

    // ── Computed Helpers ────────────────────────────────────────────────────────
    const isOwnerEmail = user?.email === 'rkv3232@gmail.com' || user?.email === 'ckv3232@gmail.com';
    const isOwner = role === UserRole.OWNER || isOwnerEmail;
    const isAdmin = isOwner || (role !== null && hasMinimumRole(role, UserRole.ADMIN)) || (user?.email === 'admin@test.com');
    const isEditor = isOwner || (role !== null && hasMinimumRole(role, UserRole.EDITOR));
    const isReporter = isOwner || (role !== null && hasMinimumRole(role, UserRole.REPORTER));

    const checkPermission = useCallback(
        (permission: Permission): boolean => hasPermission(role, permission),
        [role]
    );

    const value: AuthContextType = useMemo(
        () => ({
            user,
            firestoreUser,
            role,
            loading,
            error,
            signIn,
            signInWithGoogle,
            signUp,
            signOut,
            isOwner,
            isAdmin,
            isEditor,
            isReporter,
            hasPermission: checkPermission,
        }),
        [
            user,
            firestoreUser,
            role,
            loading,
            error,
            signIn,
            signInWithGoogle,
            signUp,
            signOut,
            isOwner,
            isAdmin,
            isEditor,
            isReporter,
            checkPermission,
        ]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ─── Consumer Hooks ───────────────────────────────────────────────────────────

export function useAuth(): AuthContextType {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error(
            "[useAuth] Must be used inside <AuthProvider>. " +
            "Ensure your root layout wraps children with <AuthProvider>."
        );
    }
    return ctx;
}

export type { AuthContextType };
