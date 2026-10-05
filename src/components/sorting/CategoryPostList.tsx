'use client';

import { useState, useEffect } from "react";
import { Post } from "@/lib/posts";
import NewsCard from "@/components/NewsCard";
import SortSelector from "./SortSelector";
import { SortOption } from "@/types/sorting";
import { useSearchParams } from "next/navigation";
import { useSortedPosts } from "@/hooks/useSortedPosts";

interface Props {
    initialPosts: Post[];
    category: string;
}

export default function CategoryPostList({ initialPosts, category }: Props) {
    const searchParams = useSearchParams();

    // Check URL or localStorage for default sort, fallback to latest
    const [sort, setSort] = useState<SortOption>(() => {
        if (typeof window !== 'undefined') {
            const urlSort = searchParams.get('sort') as SortOption;
            if (urlSort) return urlSort;
            const localSort = localStorage.getItem('newsportal-sort-pref') as SortOption;
            if (localSort) return localSort;
        }
        return 'latest';
    });

    const { posts, loading, error, setSort: setApiSort } = useSortedPosts(sort, category);

    // Render fetched sorted posts or fallback to initial SSR posts
    const displayPosts = (posts && posts.length > 0) ? posts : initialPosts;

    return (
        <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <h2 className="text-xl font-bold text-gray-800">ताज़ा समाचार</h2>
                <SortSelector value={sort} onChange={setSort} />
            </div>

            {error && (
                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl mb-6">
                    <p className="text-yellow-700 text-sm">
                        {error}
                        <br /><span className="text-xs mt-1 block opacity-70">Check browser console for Firebase index creation link.</span>
                    </p>
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 relative">
                {/* Loader overlay during soft transitions */}
                {loading && (
                    <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex text-center justify-center items-start pt-20">
                        <div className="w-8 h-8 border-4 border-red-500 border-t-white rounded-full animate-spin"></div>
                    </div>
                )}

                {displayPosts.map((post) => (
                    // In a Framer Motion setup, this would be <motion.div layoutId={post.id}>
                    <div key={post.id} className="transition-all duration-300">
                        <NewsCard post={post} />
                    </div>
                ))}
            </div>

            {displayPosts.length === 0 && !loading && !error && (
                <p className="text-gray-500 text-center py-10">इस श्रेणी में अभी कोई खबर नहीं है।</p>
            )}
        </div>
    );
}
