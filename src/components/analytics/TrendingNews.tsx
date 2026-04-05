"use client";

import { Flame, Eye, Tag } from "lucide-react";
import type { Post } from "@/types";

interface Props {
    posts: Post[];
}

export default function TrendingNews({ posts }: Props) {
    if (posts.length === 0) {
        return (
            <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
                <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                    <Flame size={20} className="text-orange-500" />
                    Trending News
                </h3>
                <p className="mt-4 text-center text-gray-400">No trending posts yet</p>
            </div>
        );
    }

    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                <Flame size={20} className="text-orange-500" />
                Trending News
            </h3>

            <div className="space-y-3">
                {posts.map((post, idx) => (
                    <div
                        key={post.id}
                        className="flex items-center gap-4 rounded-xl p-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    >
                        {/* Rank */}
                        <div
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white ${idx === 0
                                    ? "bg-yellow-500"
                                    : idx === 1
                                        ? "bg-gray-400"
                                        : idx === 2
                                            ? "bg-amber-700"
                                            : "bg-gray-300 dark:bg-gray-600"
                                }`}
                        >
                            {idx + 1}
                        </div>

                        {/* Info */}
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                                {post.title}
                            </p>
                            <div className="mt-1 flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                                <span className="flex items-center gap-1">
                                    <Tag size={12} />
                                    {post.category}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Eye size={12} />
                                    {(post.views || 0).toLocaleString()} views
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
