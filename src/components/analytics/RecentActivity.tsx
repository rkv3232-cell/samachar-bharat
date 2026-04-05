"use client";

import { FileText, MessageSquare, Clock } from "lucide-react";
import type { Post, Comment } from "@/types";

interface Props {
    posts: Post[];
    comments: Comment[];
}

function timeAgo(ts: any): string {
    if (!ts?.toDate) return "";
    const seconds = Math.floor(
        (Date.now() - ts.toDate().getTime()) / 1000
    );
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}

export default function RecentActivity({ posts, comments }: Props) {
    return (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Recent Posts */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
                <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                    <FileText size={20} className="text-blue-500" />
                    Recent Posts
                </h3>

                {posts.length === 0 ? (
                    <p className="text-center text-sm text-gray-400">No posts yet</p>
                ) : (
                    <div className="space-y-3">
                        {posts.map((post) => (
                            <div
                                key={post.id}
                                className="flex items-start gap-3 rounded-xl p-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50"
                            >
                                <div className="mt-0.5 rounded-lg bg-blue-100 p-2 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400">
                                    <FileText size={14} />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                                        {post.title}
                                    </p>
                                    <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-400">
                                        <Clock size={10} />
                                        {timeAgo(post.createdAt)}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Recent Comments */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
                <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                    <MessageSquare size={20} className="text-purple-500" />
                    Recent Comments
                </h3>

                {comments.length === 0 ? (
                    <p className="text-center text-sm text-gray-400">
                        No comments yet
                    </p>
                ) : (
                    <div className="space-y-3">
                        {comments.map((comment) => (
                            <div
                                key={comment.id}
                                className="flex items-start gap-3 rounded-xl p-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50"
                            >
                                <div className="mt-0.5 rounded-lg bg-purple-100 p-2 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400">
                                    <MessageSquare size={14} />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                                        {comment.message}
                                    </p>
                                    <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-400">
                                        <Clock size={10} />
                                        {timeAgo(comment.createdAt)}
                                        {[comment.userName, comment.name].filter(Boolean)[0] && (
                                            <span className="ml-1">
                                                — {[comment.userName, comment.name].filter(Boolean)[0]}
                                            </span>
                                        )}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
