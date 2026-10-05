"use client";

import { Flame, Eye, Tag } from "lucide-react";
import type { Post } from "@/types";

interface Props {
    posts: Post[];
}

export default function TrendingNews({ posts }: Props) {
    if (posts.length === 0) {
        return (
            <div className="rounded-xl border border-gray-200/90 bg-white p-3.5 shadow-2xs">
                <h3 className="flex items-center gap-1.5 text-xs font-bold text-gray-900">
                    <Flame size={14} className="text-orange-500" />
                    Trending News
                </h3>
                <p className="mt-3 text-center text-xs text-gray-400">No trending posts yet</p>
            </div>
        );
    }

    return (
        <div className="rounded-xl border border-gray-200/90 bg-white p-3.5 shadow-2xs">
            <h3 className="mb-2.5 flex items-center gap-1.5 text-xs font-bold text-gray-900">
                <Flame size={14} className="text-orange-500" />
                Trending News
            </h3>

            <div className="space-y-1.5">
                {posts.map((post, idx) => (
                    <div
                        key={post.id}
                        className="flex items-center gap-2.5 rounded-lg p-1.5 transition-colors hover:bg-gray-50"
                    >
                        {/* Rank */}
                        <div
                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-bold text-white ${idx === 0
                                ? "bg-yellow-500"
                                : idx === 1
                                    ? "bg-gray-400"
                                    : idx === 2
                                        ? "bg-amber-700"
                                        : "bg-gray-300"
                                }`}
                        >
                            {idx + 1}
                        </div>

                        {/* Info */}
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-semibold text-gray-900">
                                {post.title}
                            </p>
                            <div className="mt-0.5 flex items-center gap-2 text-[10px] text-gray-500">
                                <span className="flex items-center gap-0.5">
                                    <Tag size={10} />
                                    {post.category}
                                </span>
                                <span className="flex items-center gap-0.5">
                                    <Eye size={10} />
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
