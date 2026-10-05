// src/components/ui/RoleBadge.tsx
// Displays a styled badge for a user's role.
// Covers all 5 roles: owner, admin, editor, reporter, user.

"use client";

import { Crown, Shield, Edit3, PenTool, User } from "lucide-react";
import { UserRole } from "@/types/auth.types";

const roleConfig: Record<
    UserRole,
    { label: string; icon: React.ReactNode; classes: string }
> = {
    [UserRole.OWNER]: {
        label: "Owner",
        icon: <Crown size={12} />,
        classes: "bg-amber-50 text-amber-800 border-amber-300 font-semibold",
    },
    [UserRole.ADMIN]: {
        label: "Admin",
        icon: <Shield size={12} />,
        classes: "bg-red-50 text-red-700 border-red-200 font-semibold",
    },
    [UserRole.EDITOR]: {
        label: "Editor",
        icon: <Edit3 size={12} />,
        classes: "bg-purple-50 text-purple-700 border-purple-200 font-semibold",
    },
    [UserRole.REPORTER]: {
        label: "Reporter",
        icon: <PenTool size={12} />,
        classes: "bg-blue-50 text-blue-700 border-blue-200 font-semibold",
    },
    [UserRole.USER]: {
        label: "User",
        icon: <User size={12} />,
        classes: "bg-gray-100 text-gray-700 border-gray-300 font-medium",
    },
};

interface RoleBadgeProps {
    role: UserRole | string;
}

export default function RoleBadge({ role }: RoleBadgeProps) {
    const resolvedRole = Object.values(UserRole).includes(role as UserRole)
        ? (role as UserRole)
        : UserRole.USER;

    const config = roleConfig[resolvedRole];

    return (
        <span
            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${config.classes}`}
        >
            {config.icon}
            {config.label}
        </span>
    );
}
