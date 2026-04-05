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

    const loadData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await fetchAnalytics(filter);
            setData(result);
        } catch (err: any) {
            console.error("Analytics fetch error:", err);
            setError(err.message || "Failed to load analytics");
            toast.error("Failed to load analytics data");
        } finally {
            setLoading(false);
        }
    }, [filter]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Toaster position="top-right" />

            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                {/* ── Header ── */}
                <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="flex items-center gap-3 text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
                            <div className="rounded-xl bg-blue-100 p-2 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400">
                                <BarChart3 size={28} />
                            </div>
                            Analytics Dashboard
                        </h1>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            Monitor your news website performance in real-time
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <DateFilter active={filter} onChange={setFilter} />
                        <button
                            onClick={loadData}
                            disabled={loading}
                            className="rounded-xl border border-gray-200 bg-white p-2.5 text-gray-600 transition-all hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                            title="Refresh"
                        >
                            <RefreshCw
                                size={18}
                                className={loading ? "animate-spin" : ""}
                            />
                        </button>
                    </div>
                </div>

                {/* ── Error State ── */}
                {error && (
                    <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
                        <p className="font-medium">Error loading analytics</p>
                        <p className="mt-1">{error}</p>
                        <button
                            onClick={loadData}
                            className="mt-2 text-sm font-medium underline"
                        >
                            Try again
                        </button>
                    </div>
                )}

                {/* ── Loading State ── */}
                {loading && !data && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <CardSkeleton key={i} />
                            ))}
                        </div>
                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                            <ChartSkeleton />
                            <TableSkeleton />
                        </div>
                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                            <ChartSkeleton />
                            <ChartSkeleton />
                        </div>
                    </div>
                )}

                {/* ── Data ── */}
                {data && (
                    <div className="space-y-6">
                        {/* Overview Cards */}
                        <OverviewCards data={data.overview} />

                        {/* Row: Daily Views + Trending */}
                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                            <div className="lg:col-span-2">
                                <DailyViewsChart data={data.dailyViews} />
                            </div>
                            <div>
                                <TrendingNews posts={data.trendingPosts} />
                            </div>
                        </div>

                        {/* Row: Categories + Peak Hours */}
                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                            <TopCategoriesChart data={data.topCategories} />
                            <DailyDistributionChart data={data.dailyDistribution} />
                        </div>

                        {/* Row: Posts Created + User Growth */}
                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
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
        </div>
    );
}
