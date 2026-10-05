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
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {/* Recent Posts */}
            <div className="rounded-xl border border-gray-200/90 bg-white p-3.5 shadow-2xs">
                <h3 className="mb-2.5 flex items-center gap-1.5 text-xs font-bold text-gray-900">
                    <FileText size={14} className="text-blue-500" />
                    Recent Posts
                </h3>

                {posts.length === 0 ? (
                    <p className="text-center text-xs text-gray-400 py-3">No posts yet</p>
                ) : (
                    <div className="space-y-1.5">
                        {posts.map((post) => (
                            <div
                                key={post.id}
                                className="flex items-start gap-2 rounded-lg p-1.5 transition-colors hover:bg-gray-50"
                            >
                                <div className="mt-0.5 rounded-md bg-blue-50 p-1 text-blue-600 shrink-0">
                                    <FileText size={12} />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-xs font-semibold text-gray-900">
                                        {post.title}
                                    </p>
                                    <p className="mt-0.5 flex items-center gap-1 text-[10px] text-gray-400">
                                        <Clock size={9} />
                                        {timeAgo(post.createdAt)}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Recent Comments */}
            <div className="rounded-xl border border-gray-200/90 bg-white p-3.5 shadow-2xs">
                <h3 className="mb-2.5 flex items-center gap-1.5 text-xs font-bold text-gray-900">
                    <MessageSquare size={14} className="text-purple-500" />
                    Recent Comments
                </h3>

                {comments.length === 0 ? (
                    <p className="text-center text-xs text-gray-400 py-3">
                        No comments yet
                    </p>
                ) : (
                    <div className="space-y-1.5">
                        {comments.map((comment) => (
                            <div
                                key={comment.id}
                                className="flex items-start gap-2 rounded-lg p-1.5 transition-colors hover:bg-gray-50"
                            >
                                <div className="mt-0.5 rounded-md bg-purple-50 p-1 text-purple-600 shrink-0">
                                    <MessageSquare size={12} />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-xs font-semibold text-gray-900">
                                        {comment.message}
                                    </p>
                                    <p className="mt-0.5 flex items-center gap-1 text-[10px] text-gray-400">
                                        <Clock size={9} />
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
