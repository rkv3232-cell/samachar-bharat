'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { addComment } from '@/lib/comments';
import { toast } from 'sonner';

interface Props {
    postId: string;
}

export default function CommentForm({ postId }: Props) {
    const { user } = useAuth();
    const [content, setContent] = useState('');
    const [name, setName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Basic protection against multiple quick submissions
    const [lastSubmitTime, setLastSubmitTime] = useState<number>(0);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const trimmedContent = content.trim();
        if (trimmedContent.length < 5) {
            return toast.error("Comment must be at least 5 characters.");
        }

        const authorName = user?.displayName || name.trim() || 'Anonymous Reader';
        if (!user && !name.trim()) {
            return toast.error("Please enter your name to comment as a guest.");
        }

        // Rate limiting: 1 comment per 30 seconds
        const now = Date.now();
        if (now - lastSubmitTime < 30000) {
            return toast.error("Please wait 30 seconds before commenting again.");
        }

        setIsSubmitting(true);
        try {
            await addComment(postId, {
                authorName,
                authorAvatar: user?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(authorName)}&background=random`,
                authorId: user?.uid || null,
                content: trimmedContent,
                parentId: null
            });

            setContent('');
            if (!user) setName(''); // Keep name if authenticated otherwise reset
            setLastSubmitTime(now);
            toast.success("Comment added successfully!");
        } catch (error) {
            toast.error("Failed to add comment. Try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-8">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Leave a Comment</h3>

            {!user && (
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
                    <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                        placeholder="Enter your name"
                        disabled={isSubmitting}
                    />
                </div>
            )}

            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Your Comment</label>
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    required
                    maxLength={1000}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 outline-none resize-none"
                    placeholder="Write your thoughts here..."
                    disabled={isSubmitting}
                />
                <div className="flex justify-end mt-1 text-xs text-gray-400">
                    {content.length}/1000
                </div>
            </div>

            <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">
                    {user ? `Commenting as ${user.displayName || user.email}` : "Commenting as Guest"}
                </span>
                <button
                    type="submit"
                    disabled={isSubmitting || content.trim().length === 0}
                    className="bg-red-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSubmitting ? 'Posting...' : 'Post Comment'}
                </button>
            </div>
        </form>
    );
}
