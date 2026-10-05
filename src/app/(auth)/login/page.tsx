// src/app/(auth)/login/page.tsx
// Universal Login + Signup page for all users — 100% Light Mode & Compact.
// Query param: ?tab=signup  → opens signup tab by default.

"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getAuth } from "firebase/auth";
import Image from "next/image";
import Link from "next/link";
import { Lock, Mail, Eye, EyeOff, AlertCircle, User, Loader2, ArrowLeft } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

function LoginSignupForm() {
    const { signIn, signUp, signInWithGoogle, user, isAdmin, loading: authLoading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();

    const [tab, setTab] = useState<"login" | "signup">("login");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [isNative, setIsNative] = useState(false);

    // Auto-redirect if already logged in
    useEffect(() => {
        if (!authLoading && user) {
            const syncAndRedirect = async () => {
                try {
                    const authInstance = getAuth();
                    if (authInstance.currentUser) {
                        const idToken = await authInstance.currentUser.getIdToken();
                        await fetch("/api/auth/session", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ idToken }),
                        });
                    }
                } catch {
                    // Non-critical
                }
                if (isAdmin) {
                    router.replace("/admin");
                } else {
                    router.replace("/");
                }
            };
            syncAndRedirect();
        }
    }, [user, isAdmin, authLoading, router]);

    useEffect(() => {
        if (typeof window !== "undefined") {
            const win = window as any;
            if (win.Capacitor && win.Capacitor.isNative) {
                setIsNative(true);
            }
        }
    }, []);

    // Respect ?tab=signup from Navbar/Footer
    useEffect(() => {
        if (searchParams.get("tab") === "signup") {
            setTab("signup");
        }
    }, [searchParams]);

    const handleGoogleSignIn = async () => {
        if (loading) return;
        setError("");
        setLoading(true);
        try {
            await signInWithGoogle();

            const auth = getAuth();
            const currentUser = auth.currentUser;
            if (!currentUser) throw new Error("Google login failed.");

            const idToken = await currentUser.getIdToken();
            await fetch("/api/auth/session", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ idToken }),
            });

            // Role check and redirect
            const verifyRes = await fetch("/api/auth/verify");
            if (verifyRes.ok) {
                const { role } = await verifyRes.json() as { role: string };
                if (["owner", "admin"].includes(role)) {
                    router.replace("/admin");
                } else if (["editor", "reporter"].includes(role)) {
                    router.replace("/editor");
                } else {
                    router.replace("/");
                }
            } else {
                router.replace("/");
            }
        } catch (err: any) {
            console.error("Google Auth Error:", err);
            setError("Google लॉगिन में समस्या आई।");
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (loading) return;
        setError("");
        setLoading(true);
        try {
            await signIn(email, password);

            const auth = getAuth();
            const currentUser = auth.currentUser;
            if (!currentUser) throw new Error("Login failed — user not found.");

            const idToken = await currentUser.getIdToken();
            const sessionRes = await fetch("/api/auth/session", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ idToken }),
            });

            if (!sessionRes.ok) throw new Error("Session creation failed.");

            // Smart Redirect based on role
            const verifyRes = await fetch("/api/auth/verify");
            if (verifyRes.ok) {
                const { role } = await verifyRes.json() as { role: string };
                if (["owner", "admin"].includes(role)) {
                    router.replace("/admin");
                } else if (["editor", "reporter"].includes(role)) {
                    router.replace("/editor");
                } else {
                    router.replace("/");
                }
            } else {
                router.replace("/");
            }
        } catch (err: unknown) {
            const fe = err as { code?: string };
            if (
                fe.code === "auth/invalid-credential" ||
                fe.code === "auth/wrong-password" ||
                fe.code === "auth/user-not-found" ||
                fe.code === "auth/invalid-email"
            ) {
                setError("गलत email या password। कृपया दोबारा कोशिश करें।");
            } else {
                setError("लॉगिन में त्रुटि हुई। Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (loading) return;
        setError("");
        if (!name.trim()) { setError("नाम जरूरी है।"); return; }
        if (password.length < 6) { setError("Password कम से कम 6 characters का होना चाहिए।"); return; }
        setLoading(true);
        try {
            await signUp(email, password, name.trim());

            const auth = getAuth();
            const currentUser = auth.currentUser;
            if (!currentUser) throw new Error("Signup failed.");

            const idToken = await currentUser.getIdToken();
            await fetch("/api/auth/session", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ idToken }),
            });

            // New users go to homepage
            router.replace("/");
        } catch (err: unknown) {
            const fe = err as { code?: string; message?: string };
            if (fe.code === "auth/email-already-in-use") {
                setError("यह email already registered है। Login करें।");
            } else {
                setError(fe.message ?? "Signup में त्रुटि हुई।");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-sm">
                {/* Back to Home Link */}
                <div className="mb-4">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-red-600 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" /> मुख्य पृष्ठ पर वापस जाएँ
                    </Link>
                </div>

                {/* Brand Logo & Heading */}
                <div className="text-center mb-6">
                    <Link href="/" className="inline-block">
                        <img
                            src="/logo.png"
                            alt="Samachar Bharat"
                            className="w-12 h-12 object-contain mx-auto mb-2 drop-shadow-sm"
                        />
                    </Link>
                    <h1 className="text-xl font-black text-gray-900 leading-tight">
                        <span className="text-red-600">SAMACHAR</span> BHARAT
                    </h1>
                    <p className="text-[11px] font-bold text-gray-500 tracking-wider uppercase mt-0.5">
                        सत्य • सटीक • सबसे पहले
                    </p>
                </div>

                {/* Card Container */}
                <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-200">
                    {/* Tabs */}
                    <div className="flex border-b border-gray-200 bg-gray-50/60">
                        <button
                            type="button"
                            onClick={() => { setTab("login"); setError(""); }}
                            className={`flex-1 py-3 text-xs font-bold transition-all ${tab === "login"
                                ? "text-red-600 bg-white border-b-2 border-red-600 shadow-xs"
                                : "text-gray-500 hover:text-gray-800"
                                }`}
                        >
                            लॉगिन करें
                        </button>
                        <button
                            type="button"
                            onClick={() => { setTab("signup"); setError(""); }}
                            className={`flex-1 py-3 text-xs font-bold transition-all ${tab === "signup"
                                ? "text-red-600 bg-white border-b-2 border-red-600 shadow-xs"
                                : "text-gray-500 hover:text-gray-800"
                                }`}
                        >
                            नया खाता
                        </button>
                    </div>

                    <div className="p-5 sm:p-6">
                        {error && (
                            <div className="mb-4 p-2.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
                                <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                                <p className="text-red-600 text-xs font-medium">{error}</p>
                            </div>
                        )}

                        {tab === "login" ? (
                            <form onSubmit={handleLogin} className="space-y-3.5">
                                <div className="space-y-1">
                                    <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider px-0.5">Email</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            className="w-full pl-10 pr-3 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:bg-white outline-none transition-all text-xs sm:text-sm text-gray-800"
                                            placeholder="you@example.com"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider px-0.5">Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:bg-white outline-none transition-all text-xs sm:text-sm text-gray-800"
                                            placeholder="••••••••"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                            tabIndex={-1}
                                        >
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 text-xs sm:text-sm disabled:opacity-60 active:scale-[0.98] mt-2"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            <span>लॉगिन हो रहा है...</span>
                                        </>
                                    ) : (
                                        <span>लॉगिन करें</span>
                                    )}
                                </button>
                            </form>
                        ) : (
                            <form onSubmit={handleSignup} className="space-y-3.5">
                                <div className="space-y-1">
                                    <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider px-0.5">पूरा नाम</label>
                                    <div className="relative">
                                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            required
                                            className="w-full pl-10 pr-3 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:bg-white outline-none transition-all text-xs sm:text-sm text-gray-800"
                                            placeholder="राहुल शर्मा"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider px-0.5">Email</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            className="w-full pl-10 pr-3 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:bg-white outline-none transition-all text-xs sm:text-sm text-gray-800"
                                            placeholder="you@example.com"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider px-0.5">Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            minLength={6}
                                            className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:bg-white outline-none transition-all text-xs sm:text-sm text-gray-800"
                                            placeholder="कम से कम 6 अक्षर"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                            tabIndex={-1}
                                        >
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 text-xs sm:text-sm disabled:opacity-60 active:scale-[0.98] mt-2"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            <span>खाता बन रहा है...</span>
                                        </>
                                    ) : (
                                        <span>खाता बनाएं</span>
                                    )}
                                </button>
                            </form>
                        )}

                        {!isNative && (
                            <>
                                <div className="my-4 flex items-center gap-3">
                                    <div className="h-[1px] flex-1 bg-gray-200" />
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">या</span>
                                    <div className="h-[1px] flex-1 bg-gray-200" />
                                </div>

                                <button
                                    type="button"
                                    onClick={handleGoogleSignIn}
                                    disabled={loading}
                                    className="w-full bg-white hover:bg-gray-50 text-gray-700 font-semibold py-2.5 rounded-xl border border-gray-300 shadow-xs transition-all flex items-center justify-center gap-2.5 text-xs sm:text-sm disabled:opacity-70 active:scale-[0.98]"
                                >
                                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                                        <path fill="#EA4335" d="M12 5.04c1.94 0 3.68.67 5.05 1.97l3.77-3.77C18.54 1.15 15.48 0 12 0 7.31 0 3.25 2.69 1.24 6.6l4.41 3.42C6.7 7.12 9.1 5.04 12 5.04z" />
                                        <path fill="#4285F4" d="M23.49 12.27c0-.8-.07-1.56-.19-2.27H12v4.3h6.44c-.28 1.47-1.11 2.71-2.36 3.55l3.66 2.84c2.14-1.98 3.39-4.9 3.39-8.42z" />
                                        <path fill="#FBBC05" d="M5.65 14.18c-.28-.84-.44-1.74-.44-2.68s.16-1.84.44-2.68L1.24 5.4C.45 7.31 0 9.49 0 11.75s.45 4.44 1.24 6.35l4.41-3.92z" />
                                        <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.94-2.91l-3.66-2.84c-1.1.74-2.51 1.17-4.28 1.17-3.29 0-6.08-2.22-7.07-5.2l-4.41 3.42C3.25 21.31 7.31 24 12 24z" />
                                    </svg>
                                    <span>Google से लॉगिन करें</span>
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="w-8 h-8 border-3 border-red-600/30 border-t-red-600 rounded-full animate-spin" />
            </div>
        }>
            <LoginSignupForm />
        </Suspense>
    );
}
