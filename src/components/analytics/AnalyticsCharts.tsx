"use client";

import {
    ResponsiveContainer,
    AreaChart,
    Area,
    BarChart,
    Bar,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
} from "recharts";
import { BarChart3, TrendingUp, Users } from "lucide-react";
import type { ChartDataPoint } from "@/types";

// ── Shared wrapper ──
function ChartCard({
    title,
    icon,
    children,
}: {
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
}) {
    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                {icon}
                {title}
            </h3>
            <div className="h-72 w-full">{children}</div>
        </div>
    );
}

// ── Short date label for X axis ──
function shortDate(dateStr: string) {
    const d = new Date(dateStr);
    return `${d.getDate()}/${d.getMonth() + 1}`;
}

// ─────────────────────────────────────
//  1. Daily Views — Area Chart
// ─────────────────────────────────────

export function DailyViewsChart({ data }: { data: ChartDataPoint[] }) {
    return (
        <ChartCard
            title="Daily Views"
            icon={<TrendingUp size={20} className="text-blue-500" />}
        >
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                    data={data}
                    margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                >
                    <defs>
                        <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                        dataKey="date"
                        tickFormatter={shortDate}
                        tick={{ fontSize: 12 }}
                        stroke="#9ca3af"
                    />
                    <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
                    <Tooltip
                        contentStyle={{
                            borderRadius: "12px",
                            border: "1px solid #e5e7eb",
                            boxShadow: "0 4px 6px -1px rgba(0,0,0,.1)",
                        }}
                        labelFormatter={(l) => `Date: ${l}`}
                    />
                    <Area
                        type="monotone"
                        dataKey="value"
                        name="Views"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        fill="url(#viewsGrad)"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </ChartCard>
    );
}

// ─────────────────────────────────────
//  2. Posts Created — Bar Chart
// ─────────────────────────────────────

export function PostsCreatedChart({ data }: { data: ChartDataPoint[] }) {
    return (
        <ChartCard
            title="Posts Created"
            icon={<BarChart3 size={20} className="text-emerald-500" />}
        >
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={data}
                    margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                        dataKey="date"
                        tickFormatter={shortDate}
                        tick={{ fontSize: 12 }}
                        stroke="#9ca3af"
                    />
                    <YAxis
                        tick={{ fontSize: 12 }}
                        stroke="#9ca3af"
                        allowDecimals={false}
                    />
                    <Tooltip
                        contentStyle={{
                            borderRadius: "12px",
                            border: "1px solid #e5e7eb",
                        }}
                        labelFormatter={(l) => `Date: ${l}`}
                    />
                    <Bar
                        dataKey="value"
                        name="Posts"
                        fill="#10b981"
                        radius={[6, 6, 0, 0]}
                    />
                </BarChart>
            </ResponsiveContainer>
        </ChartCard>
    );
}

// ─────────────────────────────────────
//  3. User Growth — Line Chart
// ─────────────────────────────────────

export function UserGrowthChart({ data }: { data: ChartDataPoint[] }) {
    return (
        <ChartCard
            title="User Growth"
            icon={<Users size={20} className="text-purple-500" />}
        >
            <ResponsiveContainer width="100%" height="100%">
                <LineChart
                    data={data}
                    margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                        dataKey="date"
                        tickFormatter={shortDate}
                        tick={{ fontSize: 12 }}
                        stroke="#9ca3af"
                    />
                    <YAxis
                        tick={{ fontSize: 12 }}
                        stroke="#9ca3af"
                        allowDecimals={false}
                    />
                    <Tooltip
                        contentStyle={{
                            borderRadius: "12px",
                            border: "1px solid #e5e7eb",
                        }}
                        labelFormatter={(l) => `Date: ${l}`}
                    />
                    <Line
                        type="monotone"
                        dataKey="value"
                        name="Users"
                        stroke="#8b5cf6"
                        strokeWidth={2}
                        dot={{ r: 4, fill: "#8b5cf6" }}
                        activeDot={{ r: 6 }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </ChartCard>
    );
}

// ─────────────────────────────────────
//  4. Top Categories — Bar Chart
// ─────────────────────────────────────

export function TopCategoriesChart({ data }: { data: { name: string; count: number }[] }) {
    return (
        <ChartCard
            title="Top Categories"
            icon={<BarChart3 size={20} className="text-orange-500" />}
        >
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={data}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                    <XAxis type="number" hide />
                    <YAxis
                        dataKey="name"
                        type="category"
                        tick={{ fontSize: 12 }}
                        width={100}
                    />
                    <Tooltip />
                    <Bar dataKey="count" fill="#f97316" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
            </ResponsiveContainer>
        </ChartCard>
    );
}

// ─────────────────────────────────────
//  5. Daily Distribution — Area Chart
// ─────────────────────────────────────

export function DailyDistributionChart({ data }: { data: { hour: string; views: number }[] }) {
    return (
        <ChartCard
            title="Peak Hours"
            icon={<TrendingUp size={20} className="text-pink-500" />}
        >
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Area type="monotone" dataKey="views" stroke="#ec4899" fill="#fbcfe8" />
                </AreaChart>
            </ResponsiveContainer>
        </ChartCard>
    );
}
