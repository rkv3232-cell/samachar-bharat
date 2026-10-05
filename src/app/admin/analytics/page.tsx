"use client";

import { useState, useEffect, useCallback } from "react";
import { BarChart3, RefreshCw } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

import { fetchAnalytics } from "@/lib/firestore";
import type { AnalyticsData, DateFilter as DateFilterType } from "@/types";

import DateFilter from "@/components/analytics/DateFilter";
import OverviewCards from "@/components/analytics/OverviewCards";
import TrendingNews from "@/components/analytics/TrendingNews";
import {
    DailyViewsChart,
    PostsCreatedChart,
    UserGrowthChart,
    TopCategoriesChart,
    DailyDistributionChart,
} from "@/components/analytics/AnalyticsCharts";
import RecentActivity from "@/components/analytics/RecentActivity";
import {
    CardSkeleton,
    ChartSkeleton,
    TableSkeleton,
} from "@/components/ui/Skeleton";

export default function AnalyticsPage() {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [filter, setFilter] = useState<DateFilterType>("7days");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadData = useCallback(async (isInitial = false) => {
        if (!isInitial) {
            setLoading(true);
        }
        try {
            const result = await fetchAnalytics(filter);
            setData(result);
            setError(null);
        } catch (err: any) {
            console.error("Analytics fetch error:", err);
            setError(err.message || "Failed to load analytics");
            toast.error("Failed to load analytics data");
        } finally {
            setLoading(false);
        }
    }, [filter]);

    useEffect(() => {
        loadData(true);
    }, [loadData]);

    return (
        <div className="space-y-3.5">
            <Toaster position="top-right" />

            {/* ── Header ── */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="flex items-center gap-2 text-lg font-extrabold text-gray-900 tracking-tight">
                        <div className="rounded-lg bg-blue-50 p-1.5 text-blue-600">
                            <BarChart3 size={18} />
                        </div>
                        Analytics Dashboard
                    </h1>
                    <p className="text-xs text-gray-500">
                        Monitor your news website performance in real-time
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <DateFilter active={filter} onChange={setFilter} />
                    <button
                        onClick={() => loadData(false)}
                        disabled={loading}
                        className="h-8 w-8 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition-all hover:bg-gray-50 disabled:opacity-50 active:scale-95"
                        title="Refresh"
                    >
                        <RefreshCw
                            size={14}
                            className={loading ? "animate-spin" : ""}
                        />
                    </button>
                </div>
            </div>

            {/* ── Error State ── */}
            {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-600">
                    <p className="font-bold">Error loading analytics</p>
                    <p className="mt-0.5">{error}</p>
                    <button
                        onClick={() => loadData(false)}
                        className="mt-1 text-xs font-semibold underline"
                    >
                        Try again
                    </button>
                </div>
            )}

            {/* ── Loading State ── */}
            {loading && !data && (
                <div className="space-y-3.5">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <CardSkeleton key={i} />
                        ))}
                    </div>
                    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                        <ChartSkeleton />
                        <TableSkeleton />
                    </div>
                    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                        <ChartSkeleton />
                        <ChartSkeleton />
                    </div>
                </div>
            )}

            {/* ── Data ── */}
            {data && (
                <div className="space-y-3.5">
                    {/* Overview Cards */}
                    <OverviewCards data={data.overview} />

                    {/* Row: Daily Views + Trending */}
                    <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
                        <div className="lg:col-span-2">
                            <DailyViewsChart data={data.dailyViews} />
                        </div>
                        <div>
                            <TrendingNews posts={data.trendingPosts} />
                        </div>
                    </div>

                    {/* Row: Categories + Peak Hours */}
                    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                        <TopCategoriesChart data={data.topCategories} />
                        <DailyDistributionChart data={data.dailyDistribution} />
                    </div>

                    {/* Row: Posts Created + User Growth */}
                    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                        <PostsCreatedChart data={data.postsCreated} />
                        <UserGrowthChart data={data.userGrowth} />
                    </div>

                    {/* Recent Activity */}
                    <RecentActivity
                        posts={data.recentPosts}
                        comments={data.recentComments}
                    />
                </div>
            )}
        </div>
    );
}
