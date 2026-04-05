"use client";

import { useState } from "react";
import {
    UserPlus,
    Mail,
    Lock,
    User,
    Shield,
    Loader2,
    Eye,
    EyeOff,
    CheckCircle,
    AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import type { CreateUserPayload, UserDocument } from "@/types";
import { UserRole } from "@/types/auth.types";

interface Props {
    onUserCreated: (user: UserDocument) => void;
}

const roles: { value: UserRole; label: string; description: string }[] = [
    {
        value: UserRole.ADMIN,
        label: "Admin",
        description: "Full access to dashboard and settings",
    },
    {
        value: UserRole.EDITOR,
        label: "Editor",
        description: "Create/edit/delete own posts, access editor panel",
    },
    {
        value: UserRole.REPORTER,
        label: "Reporter",
        description: "Can create news posts only",
    },
    {
        value: UserRole.USER,
        label: "User",
        description: "Regular user with read and comment access",
    },
    // NOTE: "owner" is NEVER in this list — owner is auto-assigned by email
];

export default function CreateUserForm({ onUserCreated }: Props) {
    const [formData, setFormData] = useState<CreateUserPayload>({
        name: "",
        email: "",
        password: "",
        role: UserRole.USER,
    });
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // ── Client-side validation ──
    function validate(): boolean {
        const newErrors: Record<string, string> = {};

        if (!formData.name.trim() || formData.name.trim().length < 2) {
            newErrors.name = "Name must be at least 2 characters";
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!formData.email.trim()) {
            newErrors.email = "Email is required";
        } else if (!emailRegex.test(formData.email)) {
            newErrors.email = "Enter a valid email address";
        }

        if (!formData.password) {
            newErrors.password = "Password is required";
        } else if (formData.password.length < 6) {
            newErrors.password = "Password must be at least 6 characters";
        } else if (formData.password.length > 128) {
            newErrors.password = "Password is too long";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }

    // ── Handle field change ──
    function handleChange(
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));

        // Clear field error on change
        if (errors[name]) {
            setErrors((prev) => {
                const next = { ...prev };
                delete next[name];
                return next;
            });
        }
    }

    // ── Submit ──
    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        if (!validate()) return;

        setLoading(true);

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);

            await setDoc(doc(db, "users", userCredential.user.uid), {
                name: formData.name || "No Name",
                email: formData.email,
                role: formData.role || "user",
                createdAt: serverTimestamp(),
            });

            toast.success("User created successfully!", {
                duration: 4000,
                icon: "🎉",
            });

            // Pass new user to parent
            onUserCreated({
                uid: userCredential.user.uid,
                name: formData.name || "No Name",
                email: formData.email,
                role: formData.role || "user",
                createdAt: new Date().toISOString(),
                status: "active" as const,
            } as UserDocument);

            // Reset form
            setFormData({
                name: "",
                email: "",
                password: "",
                role: "user",
            });
            setErrors({});
        } catch (err: any) {
            console.error("Create user error:", err);
            toast.error(err.message || "Something went wrong", {
                duration: 5000,
            });
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
            {/* Header */}
            <div className="border-b border-gray-200 px-6 py-5 dark:border-gray-700">
                <h2 className="flex items-center gap-3 text-lg font-semibold text-gray-900 dark:text-white">
                    <div className="rounded-xl bg-emerald-100 p-2 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                        <UserPlus size={20} />
                    </div>
                    Create New User
                </h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Add a new user to the system with a specific role
                </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5 p-6">
                {/* Name */}
                <div>
                    <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                        <User size={14} />
                        Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Enter full name"
                        disabled={loading}
                        className={`w-full rounded-xl border bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-500 ${errors.name
                            ? "border-red-400 focus:border-red-500 focus:ring-red-500/20"
                            : "border-gray-300 focus:border-blue-500 focus:ring-blue-500/20 dark:border-gray-600"
                            }`}
                    />
                    {errors.name && (
                        <p className="mt-1 flex items-center gap-1 text-xs text-red-500">
                            <AlertCircle size={12} />
                            {errors.name}
                        </p>
                    )}
                </div>

                {/* Email */}
                <div>
                    <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                        <Mail size={14} />
                        Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="user@example.com"
                        disabled={loading}
                        className={`w-full rounded-xl border bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-500 ${errors.email
                            ? "border-red-400 focus:border-red-500 focus:ring-red-500/20"
                            : "border-gray-300 focus:border-blue-500 focus:ring-blue-500/20 dark:border-gray-600"
                            }`}
                    />
                    {errors.email && (
                        <p className="mt-1 flex items-center gap-1 text-xs text-red-500">
                            <AlertCircle size={12} />
                            {errors.email}
                        </p>
                    )}
                </div>

                {/* Password */}
                <div>
                    <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                        <Lock size={14} />
                        Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <input
                            type={showPassword ? "text" : "password"}
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Minimum 6 characters"
                            disabled={loading}
                            className={`w-full rounded-xl border bg-white px-4 py-2.5 pr-11 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-500 ${errors.password
                                ? "border-red-400 focus:border-red-500 focus:ring-red-500/20"
                                : "border-gray-300 focus:border-blue-500 focus:ring-blue-500/20 dark:border-gray-600"
                                }`}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-300"
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                    {errors.password && (
                        <p className="mt-1 flex items-center gap-1 text-xs text-red-500">
                            <AlertCircle size={12} />
                            {errors.password}
                        </p>
                    )}
                    {/* Password strength indicator */}
                    {formData.password && !errors.password && (
                        <div className="mt-2">
                            <div className="flex gap-1">
                                {[1, 2, 3, 4].map((level) => (
                                    <div
                                        key={level}
                                        className={`h-1 flex-1 rounded-full transition-colors ${formData.password.length >= level * 4
                                            ? formData.password.length >= 12
                                                ? "bg-emerald-500"
                                                : formData.password.length >= 8
                                                    ? "bg-blue-500"
                                                    : "bg-amber-500"
                                            : "bg-gray-200 dark:bg-gray-700"
                                            }`}
                                    />
                                ))}
                            </div>
                            <p className="mt-1 text-xs text-gray-400">
                                {formData.password.length >= 12
                                    ? "Strong password"
                                    : formData.password.length >= 8
                                        ? "Good password"
                                        : formData.password.length >= 6
                                            ? "Acceptable password"
                                            : "Too short"}
                            </p>
                        </div>
                    )}
                </div>

                {/* Role */}
                <div>
                    <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                        <Shield size={14} />
                        Role <span className="text-red-500">*</span>
                    </label>

                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                        {roles.map((role) => (
                            <button
                                key={role.value}
                                type="button"
                                onClick={() =>
                                    handleChange({
                                        target: { name: "role", value: role.value },
                                    } as any)
                                }
                                disabled={loading}
                                className={`rounded-xl border-2 px-4 py-3 text-left transition-all disabled:opacity-60 ${formData.role === role.value
                                    ? "border-blue-500 bg-blue-50 shadow-md dark:bg-blue-900/20"
                                    : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600"
                                    }`}
                            >
                                <p
                                    className={`text-sm font-semibold ${formData.role === role.value
                                        ? "text-blue-700 dark:text-blue-400"
                                        : "text-gray-900 dark:text-white"
                                        }`}
                                >
                                    {role.label}
                                </p>
                                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                                    {role.description}
                                </p>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Submit Button */}
                <div className="pt-2">
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition-all hover:bg-blue-700 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none sm:w-auto"
                    >
                        {loading ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                Creating User...
                            </>
                        ) : (
                            <>
                                <UserPlus size={18} />
                                Create User
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
