'use client';

import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { toggleLikeStatus, isPostLikedLocally } from '@/lib/engagement';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth-context';

interface LikeButtonProps {
    postId: string;
    initialLikes?: number;
    showCount?: boolean;
}

export default function LikeButton({ postId, initialLikes = 0, showCount = true }: LikeButtonProps) {
    const { user } = useAuth();
    const [likes, setLikes] = useState(initialLikes);
    const [hasLiked, setHasLiked] = useState(() => isPostLikedLocally(postId, user?.uid || null));
    const [isLiking, setIsLiking] = useState(false);

    // Sync if user auth changes (0 network requests, purely local check)
    useEffect(() => {
        if (!postId) return;
        setHasLiked(isPostLikedLocally(postId, user?.uid || null));
    }, [postId, user]);

    const handleLikeToggle = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (isLiking || !postId) return;
        setIsLiking(true);

        const newLikedState = !hasLiked;

        // Instant Optimistic Update (< 1ms perceived response)
        setHasLiked(newLikedState);
        setLikes(prev => newLikedState ? prev + 1 : Math.max(0, prev - 1));

        if (newLikedState) toast.success("Post liked!");
        else toast("Like removed");

        try {
            await toggleLikeStatus(postId, user?.uid || null, newLikedState);
        } catch (error) {
            // Revert Optimistic Update
            setHasLiked(!newLikedState);
            setLikes(prev => newLikedState ? Math.max(0, prev - 1) : prev + 1);
            toast.error("Failed to save like.");
            console.error("Like toggle failed.");
        } finally {
            setIsLiking(false);
        }
    };

    return (
        <button
            type="button"
            onClick={handleLikeToggle}
            aria-label={hasLiked ? "Unlike post" : "Like post"}
            className="group flex flex-row items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-red-400 rounded-lg p-1 transition disabled:opacity-50"
            disabled={isLiking}
        >
            <div className="relative flex items-center justify-center p-1 bg-gray-50 group-hover:bg-red-50 rounded-full transition-colors">
                <AnimatePresence>
                    {hasLiked && (
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            className="absolute inset-0 bg-red-100 rounded-full"
                        />
                    )}
                </AnimatePresence>

                <motion.div
                    whileTap={{ scale: 0.8 }}
                    animate={hasLiked ? { scale: [1, 1.25, 1], rotate: [0, -10, 10, 0] } : {}}
                    className="relative z-10"
                >
                    <Heart
                        className={`w-4 h-4 md:w-5 md:h-5 transition-colors ${hasLiked
                            ? "fill-red-500 text-red-500"
                            : "text-gray-400 group-hover:text-red-400"
                            }`}
                    />
                </motion.div>
            </div>

            {showCount && (
                <span className={`text-sm md:text-base font-medium transition-colors ${hasLiked ? 'text-red-600' : 'text-gray-500'}`}>
                    {likes}
                </span>
            )}
        </button>
    );
}
