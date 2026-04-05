"use client";

import React from "react";

interface StatusBadgeProps {
    status: "approved" | "pending" | "rejected";
}

export default function StatusBadge({ status }: StatusBadgeProps) {
    const config = {
        approved: {
            bg: "bg-emerald-50",
            text: "text-emerald-700",
            dot: "bg-emerald-500",
            ring: "ring-emerald-500/20",
        },
        pending: {
            bg: "bg-amber-50",
            text: "text-amber-700",
            dot: "bg-amber-500",
            ring: "ring-amber-500/20",
        },
        rejected: {
            bg: "bg-red-50",
            text: "text-red-700",
            dot: "bg-red-500",
            ring: "ring-red-500/20",
        },
    };

    const c = config[status];

    return (
        <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ring-1 ${c.bg} ${c.text} ${c.ring}`}
        >
            <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
            {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
    );
}
