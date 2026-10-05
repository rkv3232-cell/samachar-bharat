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
    AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { createUserDocument } from "@/lib/firebase/user";
import type { CreateUserPayload, UserDocument } from "@/types";
import { UserRole } from "@/types/auth.types";

interface Props {
    onUserCreated: (user: UserDocument) => void;
}

const roles: { value: UserRole; label: string; description: string }[] = [
    {
        value: UserRole.ADMIN,
        label: "Admin",
        description: "Full CMS and settings access",
    },
    {
        value: UserRole.EDITOR,
        label: "Editor",
        description: "Create/edit/delete posts",
    },
    {
        value: UserRole.REPORTER,
        label: "Reporter",
        description: "Create news posts only",
    },
    {
        value: UserRole.USER,
        label: "User",
        description: "Reader with comment access",
    },
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

    function handleChange(
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));

        if (errors[name]) {
            setErrors((prev) => {
                const next = { ...prev };
                delete next[name];
                return next;
            });
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        if (!validate()) return;

        setLoading(true);

        try {
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                formData.email,
                formData.password
            );

            await createUserDocument(userCredential.user, {
                name: formData.name,
            });

            toast.success(`User "${formData.name}" created successfully!`, {
                icon: "✅",
            });

            onUserCreated({
                uid: userCredential.user.uid,
                name: formData.name || "No Name",
                email: formData.email,
                role: formData.role || "user",
                createdAt: new Date().toISOString(),
                status: "active" as const,
            } as UserDocument);

            setFormData({
                name: "",
                email: "",
                password: "",
                role: UserRole.USER,
            });
            setErrors({});
        } catch (err: any) {
            console.error("Create user error:", err);
            toast.error(err.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="rounded-xl border border-gray-200/80 bg-white shadow-2xs overflow-hidden">
            {/* Header */}
            <div className="border-b border-gray-100 bg-gray-50/50 px-4 py-2.5 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-sm font-bold text-gray-900">
                    <UserPlus size={16} className="text-red-600" />
                    Create New User
                </h2>
                <span className="text-xs text-gray-500">Newsroom Credentials</span>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3 p-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Name */}
                    <div>
                        <label className="mb-1 flex items-center gap-1 text-[11px] font-semibold text-gray-700 uppercase tracking-wider">
                            <User size={12} />
                            Full Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Enter full name"
                            disabled={loading}
                            className={`w-full h-8 rounded-lg border bg-white px-3 text-xs text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:ring-1 disabled:opacity-60 ${errors.name
                                ? "border-red-400 focus:border-red-500 focus:ring-red-500/20"
                                : "border-gray-200 focus:border-red-500 focus:ring-red-500/20"
                                }`}
                        />
                        {errors.name && (
                            <p className="mt-1 flex items-center gap-1 text-[11px] text-red-500">
                                <AlertCircle size={10} />
                                {errors.name}
                            </p>
                        )}
                    </div>

                    {/* Email */}
                    <div>
                        <label className="mb-1 flex items-center gap-1 text-[11px] font-semibold text-gray-700 uppercase tracking-wider">
                            <Mail size={12} />
                            Email Address <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="user@example.com"
                            disabled={loading}
                            className={`w-full h-8 rounded-lg border bg-white px-3 text-xs text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:ring-1 disabled:opacity-60 ${errors.email
                                ? "border-red-400 focus:border-red-500 focus:ring-red-500/20"
                                : "border-gray-200 focus:border-red-500 focus:ring-red-500/20"
                                }`}
                        />
                        {errors.email && (
                            <p className="mt-1 flex items-center gap-1 text-[11px] text-red-500">
                                <AlertCircle size={10} />
                                {errors.email}
                            </p>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Password */}
                    <div>
                        <label className="mb-1 flex items-center gap-1 text-[11px] font-semibold text-gray-700 uppercase tracking-wider">
                            <Lock size={12} />
                            Password <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="Min 6 chars"
                                disabled={loading}
                                className={`w-full h-8 rounded-lg border bg-white px-3 pr-8 text-xs text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:ring-1 disabled:opacity-60 ${errors.password
                                    ? "border-red-400 focus:border-red-500 focus:ring-red-500/20"
                                    : "border-gray-200 focus:border-red-500 focus:ring-red-500/20"
                                    }`}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                        </div>
                        {errors.password && (
                            <p className="mt-1 flex items-center gap-1 text-[11px] text-red-500">
                                <AlertCircle size={10} />
                                {errors.password}
                            </p>
                        )}
                    </div>

                    {/* Role Selection */}
                    <div>
                        <label className="mb-1 flex items-center gap-1 text-[11px] font-semibold text-gray-700 uppercase tracking-wider">
                            <Shield size={12} />
                            Assign Role <span className="text-red-500">*</span>
                        </label>
                        <select
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                            disabled={loading}
                            className="w-full h-8 rounded-lg border border-gray-200 bg-white px-3 text-xs text-gray-900 outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 font-semibold"
                        >
                            {roles.map((r) => (
                                <option key={r.value} value={r.value}>
                                    {r.label} — {r.description}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Submit Button */}
                <div className="pt-1 flex justify-end">
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center justify-center gap-1.5 rounded-lg bg-red-600 h-8 px-4 text-xs font-semibold text-white shadow-2xs transition-all hover:bg-red-700 disabled:opacity-60 active:scale-95"
                    >
                        {loading ? (
                            <>
                                <Loader2 size={13} className="animate-spin" />
                                Creating...
                            </>
                        ) : (
                            <>
                                <UserPlus size={13} />
                                Create User
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
