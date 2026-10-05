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
        <div className="flex flex-wrap gap-1.5">
            {filters.map((f) => (
                <button
                    key={f.key}
                    onClick={() => onChange(f.key)}
                    className={`h-8 flex items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold transition-all active:scale-95 ${active === f.key
                        ? "bg-blue-600 text-white shadow-xs"
                        : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
                        }`}
                >
                    {f.icon}
                    {f.label}
                </button>
            ))}
        </div>
    );
}
