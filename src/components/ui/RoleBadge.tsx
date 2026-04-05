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
        classes:
            "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",
    },
    [UserRole.ADMIN]: {
        label: "Admin",
        icon: <Shield size={12} />,
        classes:
            "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
    },
    [UserRole.EDITOR]: {
        label: "Editor",
        icon: <Edit3 size={12} />,
        classes:
            "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800",
    },
    [UserRole.REPORTER]: {
        label: "Reporter",
        icon: <PenTool size={12} />,
        classes:
            "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
    },
    [UserRole.USER]: {
        label: "User",
        icon: <User size={12} />,
        classes:
            "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600",
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
