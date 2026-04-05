// ============================================================
// components/admin/ui/RoleBadge.tsx
// Color-coded badge for user roles
// ============================================================

interface RoleBadgeProps {
    role: "admin" | "editor" | "user";
}

export default function RoleBadge({ role }: RoleBadgeProps) {
    const config = {
        admin: {
            bg: "bg-purple-50",
            text: "text-purple-700",
            dot: "bg-purple-500",
        },
        editor: {
            bg: "bg-blue-50",
            text: "text-blue-700",
            dot: "bg-blue-500",
        },
        user: {
            bg: "bg-gray-100",
            text: "text-gray-700",
            dot: "bg-gray-400",
        },
    };

    const { bg, text, dot } = config[role];

    return (
        <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${bg} ${text}`}
        >
            <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
            {role}
        </span>
    );
}
