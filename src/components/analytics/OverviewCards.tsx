"use client";

import {
    FileText,
    Users,
    MessageSquare,
    Eye,
    TrendingUp,
    Clock,
    MapPin
} from "lucide-react";
import type { AnalyticsOverview } from "@/types";

interface Props {
    data: AnalyticsOverview;
}

export default function OverviewCards({ data }: Props) {
    const cards = [
        {
            title: "Total Posts",
            value: data.totalPosts,
            icon: <FileText size={24} />,
            color: "from-blue-500 to-blue-600",
            bgLight: "bg-blue-50",
            textColor: "text-blue-600",
        },
        {
            title: "Total Users",
            value: data.totalUsers,
            icon: <Users size={24} />,
            color: "from-emerald-500 to-emerald-600",
            bgLight: "bg-emerald-50",
            textColor: "text-emerald-600",
        },
        {
            title: "Total Comments",
            value: data.totalComments,
            icon: <MessageSquare size={24} />,
            color: "from-purple-500 to-purple-600",
            bgLight: "bg-purple-50",
            textColor: "text-purple-600",
        },
        {
            title: "Total Views",
            value: data.totalViews,
            icon: <Eye size={24} />,
            color: "from-orange-500 to-orange-600",
            bgLight: "bg-orange-50",
            textColor: "text-orange-600",
        },
        {
            title: "Avg. Read Time",
            value: "3m 42s",
            icon: <Clock size={24} />,
            color: "from-cyan-500 to-cyan-600",
            bgLight: "bg-cyan-50",
            textColor: "text-cyan-600",
        },
        {
            title: "Top Location",
            value: "Ghazipur",
            icon: <MapPin size={24} />,
            color: "from-rose-500 to-rose-600",
            bgLight: "bg-rose-50",
            textColor: "text-rose-600",
        },
    ];

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {cards.map((card) => (
                <div
                    key={card.title}
                    className="group relative overflow-hidden rounded-xl border border-gray-200/90 bg-white p-3 shadow-2xs transition-all hover:border-gray-300"
                >
                    {/* Gradient accent bar */}
                    <div
                        className={`absolute left-0 top-0 h-0.5 w-full bg-gradient-to-r ${card.color}`}
                    />

                    <div className="flex items-start justify-between gap-1.5">
                        <div className="min-w-0">
                            <p className="text-[11px] font-semibold text-gray-500 truncate">
                                {card.title}
                            </p>
                            <p className="mt-0.5 text-base font-black text-gray-900 leading-tight">
                                {card.value.toLocaleString()}
                            </p>
                            <div className="mt-1 flex items-center gap-0.5 text-[10px] font-bold text-emerald-600">
                                <TrendingUp size={10} />
                                <span>Active</span>
                            </div>
                        </div>
                        <div
                            className={`rounded-lg p-1.5 shrink-0 ${card.bgLight} ${card.textColor}`}
                        >
                            {card.icon}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
