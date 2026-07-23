// ============================================================
// components/dpivs/ReporterStatusBadge.tsx
// Color-coded badge for reporter / press-ID status.
// Matches the existing admin StatusBadge visual style.
// ============================================================

import type { ReporterStatus } from "@/types/dpivs";

interface ReporterStatusBadgeProps {
    status: ReporterStatus;
    size?: "sm" | "md";
}

const CONFIG: Record<
    ReporterStatus,
    { bg: string; text: string; dot: string; label: string }
> = {
    active: {
        bg: "bg-emerald-50",
        text: "text-emerald-700",
        dot: "bg-emerald-500",
        label: "Active",
    },
    pending: {
        bg: "bg-amber-50",
        text: "text-amber-700",
        dot: "bg-amber-500",
        label: "Pending",
    },
    suspended: {
        bg: "bg-orange-50",
        text: "text-orange-700",
        dot: "bg-orange-500",
        label: "Suspended",
    },
    expired: {
        bg: "bg-red-50",
        text: "text-red-700",
        dot: "bg-red-500",
        label: "Expired",
    },
};

export default function ReporterStatusBadge({
    status,
    size = "md",
}: ReporterStatusBadgeProps) {
    const { bg, text, dot, label } = CONFIG[status];
    const sizing = size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs";

    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full font-semibold ${sizing} ${bg} ${text}`}
        >
            <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
            {label}
        </span>
    );
}
