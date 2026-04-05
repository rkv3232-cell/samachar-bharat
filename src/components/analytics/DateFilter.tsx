"use client";

import { Calendar, Clock, CalendarDays } from "lucide-react";
import type { DateFilter as DateFilterType } from "@/types";

interface Props {
    active: DateFilterType;
    onChange: (f: DateFilterType) => void;
}

const filters: { key: DateFilterType; label: string; icon: React.ReactNode }[] =
    [
        { key: "today", label: "Today", icon: <Clock size={16} /> },
        { key: "7days", label: "Last 7 Days", icon: <Calendar size={16} /> },
        { key: "30days", label: "Last 30 Days", icon: <CalendarDays size={16} /> },
    ];

export default function DateFilter({ active, onChange }: Props) {
    return (
        <div className="flex flex-wrap gap-2">
            {filters.map((f) => (
                <button
                    key={f.key}
                    onClick={() => onChange(f.key)}
                    className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 ${active === f.key
                            ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25"
                            : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-700"
                        }`}
                >
                    {f.icon}
                    {f.label}
                </button>
            ))}
        </div>
    );
}
