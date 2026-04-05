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
            bgLight: "bg-blue-50 dark:bg-blue-900/30",
            textColor: "text-blue-600 dark:text-blue-400",
        },
        {
            title: "Total Users",
            value: data.totalUsers,
            icon: <Users size={24} />,
            color: "from-emerald-500 to-emerald-600",
            bgLight: "bg-emerald-50 dark:bg-emerald-900/30",
            textColor: "text-emerald-600 dark:text-emerald-400",
        },
        {
            title: "Total Comments",
            value: data.totalComments,
            icon: <MessageSquare size={24} />,
            color: "from-purple-500 to-purple-600",
            bgLight: "bg-purple-50 dark:bg-purple-900/30",
            textColor: "text-purple-600 dark:text-purple-400",
        },
        {
            title: "Total Views",
            value: data.totalViews,
            icon: <Eye size={24} />,
            color: "from-orange-500 to-orange-600",
            bgLight: "bg-orange-50 dark:bg-orange-900/30",
            textColor: "text-orange-600 dark:text-orange-400",
        },
        {
            title: "Avg. Read Time",
            value: "3m 42s",
            icon: <Clock size={24} />,
            color: "from-cyan-500 to-cyan-600",
            bgLight: "bg-cyan-50 dark:bg-cyan-900/30",
            textColor: "text-cyan-600 dark:text-cyan-400",
        },
        {
            title: "Top Location",
            value: "Ghazipur",
            icon: <MapPin size={24} />,
            color: "from-rose-500 to-rose-600",
            bgLight: "bg-rose-50 dark:bg-rose-900/30",
            textColor: "text-rose-600 dark:text-rose-400",
        },
    ];

    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {cards.map((card) => (
                <div
                    key={card.title}
                    className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 dark:border-gray-700 dark:bg-gray-800"
                >
                    {/* Gradient accent bar */}
                    <div
                        className={`absolute left-0 top-0 h-1 w-full bg-gradient-to-r ${card.color}`}
                    />

                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                {card.title}
                            </p>
                            <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                                {card.value.toLocaleString()}
                            </p>
                            <div className="mt-2 flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                                <TrendingUp size={12} />
                                <span>Active</span>
                            </div>
                        </div>
                        <div
                            className={`rounded-xl p-3 ${card.bgLight} ${card.textColor}`}
                        >
                            {card.icon}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
