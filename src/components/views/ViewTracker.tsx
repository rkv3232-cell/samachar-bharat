'use client';

import { useEffect, useState } from 'react';
import { incrementPostView, formatViewCount } from '@/lib/views';
import { Eye } from 'lucide-react';
import { motion } from 'framer-motion';

interface ViewTrackerProps {
    postId: string;
    initialViews?: number;
}

export default function ViewTracker({ postId, initialViews = 0 }: ViewTrackerProps) {
    const [views, setViews] = useState(initialViews);

    useEffect(() => {
        if (!postId || typeof window === 'undefined') return;

        try {
            // Layer 1: Session Storage Duplicate Protection
            const sessionKey = `viewed_${postId}`;
            const hasViewed = window.sessionStorage.getItem(sessionKey);

            if (!hasViewed) {
                window.sessionStorage.setItem(sessionKey, 'true');
                // Deferred update to avoid synchronous cascading re-render
                queueMicrotask(() => {
                    setViews(prev => prev + 1);
                });

                // Fire and forget
                incrementPostView(postId);
            }
        } catch {
            // Private browsing/cookies disabled fallback
            incrementPostView(postId);
        }
    }, [postId]);

    // Format views mapping 1000 -> 1K
    const formattedViews = formatViewCount(views);

    return (
        <div className="flex items-center gap-1.5 text-gray-400 text-sm font-medium" title={`${views} Views`}>
            <Eye className="w-4 h-4" />
            <motion.span
                key={formattedViews}
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="tabular-nums"
            >
                {formattedViews}
            </motion.span>
        </div>
    );
}
