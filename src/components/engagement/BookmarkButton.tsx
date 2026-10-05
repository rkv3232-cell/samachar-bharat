'use client';

import { useState, useEffect } from 'react';
import { Bookmark } from 'lucide-react';
import { toggleBookmarkStatus, isPostBookmarkedLocally } from '@/lib/engagement';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth-context';

interface BookmarkButtonProps {
    postId: string;
    showLabel?: boolean;
}

export default function BookmarkButton({ postId, showLabel = false }: BookmarkButtonProps) {
    const { user } = useAuth();
    const [hasBookmarked, setHasBookmarked] = useState(() => isPostBookmarkedLocally(postId, user?.uid || null));
    const [isUpdating, setIsUpdating] = useState(false);

    // Synchronous local sync (0 network requests, purely local check)
    useEffect(() => {
        if (!postId) return;
        setHasBookmarked(isPostBookmarkedLocally(postId, user?.uid || null));
    }, [postId, user]);

    const handleToggle = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (isUpdating || !postId) return;
        setIsUpdating(true);

        const newBookmarkedState = !hasBookmarked;

        // Instant Optimistic Update (< 1ms perceived response)
        setHasBookmarked(newBookmarkedState);

        if (newBookmarkedState) toast.success("Bookmarked!");
        else toast("Bookmark removed");

        try {
            await toggleBookmarkStatus(postId, user?.uid || null, newBookmarkedState);
        } catch (error) {
            // Revert Optimistic Update
            setHasBookmarked(!newBookmarkedState);
            toast.error("Failed to save bookmark.");
            console.error("Bookmark toggle failed.");
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <button
            type="button"
            onClick={handleToggle}
            aria-label={hasBookmarked ? "Remove bookmark" : "Bookmark post"}
            className="group flex flex-row items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-blue-400 rounded-lg p-1 transition disabled:opacity-50"
            disabled={isUpdating}
        >
            <div className="relative flex items-center justify-center p-1 bg-gray-50 group-hover:bg-blue-50 rounded-full transition-colors">
                <AnimatePresence>
                    {hasBookmarked && (
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            className="absolute inset-0 bg-blue-100 rounded-full"
                        />
                    )}
                </AnimatePresence>

                <motion.div
                    whileTap={{ scale: 0.8 }}
                    animate={hasBookmarked ? { scale: [1, 1.2, 1] } : {}}
                    className="relative z-10"
                >
                    <Bookmark
                        className={`w-4 h-4 md:w-5 md:h-5 transition-colors ${hasBookmarked
                            ? "fill-blue-500 text-blue-500"
                            : "text-gray-400 group-hover:text-blue-400"
                            }`}
                    />
                </motion.div>
            </div>

            {showLabel && (
                <span className={`text-sm md:text-base font-medium transition-colors ${hasBookmarked ? 'text-blue-600' : 'text-gray-500'}`}>
                    {hasBookmarked ? "Saved" : "Save"}
                </span>
            )}
        </button>
    );
}
