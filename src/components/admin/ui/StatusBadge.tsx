// ============================================================
// components/admin/ui/StatusBadge.tsx
// Color-coded badge for comment status
// ============================================================

interface StatusBadgeProps {
    status: "approved" | "pending" | "rejected";
}

export default function StatusBadge({ status }: StatusBadgeProps) {
    const config = {
        approved: {
            bg: "bg-emerald-50",
            text: "text-emerald-700",
            dot: "bg-emerald-500",
        },
        pending: {
            bg: "bg-amber-50",
            text: "text-amber-700",
            dot: "bg-amber-500",
        },
        rejected: {
            bg: "bg-red-50",
            text: "text-red-700",
            dot: "bg-red-500",
        },
    };

    const { bg, text, dot } = config[status];

    return (
        <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${bg} ${text}`}
        >
            <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
            {status}
        </span>
    );
}
