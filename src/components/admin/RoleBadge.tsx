"use client";

import React from "react";

interface RoleBadgeProps {
    role: "admin" | "editor" | "user";
}

export default function RoleBadge({ role }: RoleBadgeProps) {
    const config = {
        admin: { bg: "bg-purple-50", text: "text-purple-700", ring: "ring-purple-500/20" },
        editor: { bg: "bg-blue-50", text: "text-blue-700", ring: "ring-blue-500/20" },
        user: { bg: "bg-gray-50", text: "text-gray-600", ring: "ring-gray-500/20" },
    };

    const c = config[role];

    return (
        <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ring-1 ${c.bg} ${c.text} ${c.ring}`}
        >
            {role.charAt(0).toUpperCase() + role.slice(1)}
        </span>
    );
}
