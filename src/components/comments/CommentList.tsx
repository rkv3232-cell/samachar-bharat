'use client';

import { useComments } from '@/hooks/useComments';
import { useAuth } from '@/lib/auth-context';
import { deleteComment } from '@/lib/comments';
import { formatDistanceToNow } from 'date-fns';
import { MoreVertical, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import { toast } from 'sonner';

interface Props {
    postId: string;
}

export default function CommentList({ postId }: Props) {
    const { comments, loading } = useComments(postId);
    const { user, userRole } = useAuth();

    if (loading) {
        return <div className="py-10 text-center text-gray-500">Loading comments...</div>;
    }

    if (comments.length === 0) {
        return (
            <div className="py-10 text-center text-gray-400 bg-gray-50 rounded-xl border border-gray-100 mb-8">
                No comments yet. Be the first to share your thoughts!
            </div>
        );
    }

    const isAdmin = userRole === 'admin';

    const handleDelete = async (commentId: string) => {
        if (!confirm("Are you sure you want to delete this comment?")) return;
        try {
            await deleteComment(postId, commentId);
            toast.success("Comment deleted");
        } catch {
            toast.error("Failed to delete comment");
        }
    };

    return (
        <div className="space-y-6 mb-10">
            <h3 className="text-xl font-bold text-gray-800">
                Comments ({comments.length})
            </h3>

            <div className="space-y-4">
                {comments.map((comment) => (
                    <div key={comment.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex gap-4 transition-all hover:shadow-md">
                        {/* Avatar */}
                        <div className="flex-shrink-0">
                            {comment.authorAvatar ? (
                                <Image
                                    src={comment.authorAvatar}
                                    alt={comment.authorName}
                                    width={40}
                                    height={40}
                                    className="rounded-full bg-gray-100 object-cover border border-gray-200"
                                />
                            ) : (
                                <div className="w-10 h-10 bg-red-100 text-red-600 rounded-full flex items-center justify-center font-bold">
                                    {(comment.authorName || "?").charAt(0).toUpperCase()}
                                </div>
                            )}
                        </div>

                        {/* Content Body */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-gray-900 truncate max-w-[150px] md:max-w-[300px]">
                                        {comment.authorName}
                                    </span>
                                    {comment.authorId === user?.uid && (
                                        <span className="bg-blue-100 text-blue-700 text-[10px] uppercase font-bold px-2 py-0.5 rounded-sm">You</span>
                                    )}
                                </div>
                                <div className="text-xs text-gray-400 flex items-center gap-1">
                                    {formatDistanceToNow(
                                        typeof comment.createdAt === 'number'
                                            ? new Date(comment.createdAt)
                                            : (comment.createdAt as any)?.toDate?.() || new Date(comment.createdAt as any),
                                        { addSuffix: true }
                                    )}
                                </div>
                            </div>

                            <p className="text-gray-700 text-sm whitespace-pre-wrap leading-relaxed mt-2"
                                dangerouslySetInnerHTML={{ __html: comment.isDeleted ? '<span class="italic text-gray-400">[This comment has been removed]</span>' : comment.content }}
                            />

                            {/* Render Delete Options logic: Only for Admins now */}
                            {!comment.isDeleted && isAdmin && (
                                <div className="mt-3 flex gap-4">
                                    <button
                                        onClick={() => handleDelete(comment.id)}
                                        className="text-xs text-red-500 hover:text-red-700 font-medium flex items-center gap-1 transition"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        Delete
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
