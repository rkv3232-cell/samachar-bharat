'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import NewsCard from '@/components/NewsCard';
import { Post, getPostById } from '@/lib/posts';
import { Bookmark } from 'lucide-react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';

export default function BookmarksPage() {
    const { user, loading: authLoading } = useAuth();
    const [bookmarkedPosts, setBookmarkedPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (authLoading) return;

        const loadBookmarks = async () => {
            setLoading(true);
            try {
                if (user) {
                    const response = await fetch('/api/engagement', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'list-bookmarks', userId: user.uid })
                    });
                    const data = await response.json();
                    setBookmarkedPosts(data.posts || []);
                } else {
                    const localIds = JSON.parse(localStorage.getItem('bookmarked_posts') || '[]');
                    if (localIds.length > 0) {
                        const posts = await Promise.all(localIds.map((id: string) => getPostById(id)));
                        setBookmarkedPosts(posts.filter(Boolean) as Post[]);
                    } else {
                        setBookmarkedPosts([]);
                    }
                }
            } catch (error) {
                console.error("Failed to load bookmarks:", error);
            } finally {
                setLoading(false);
            }
        };

        loadBookmarks();
    }, [user, authLoading]);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navbar />
            <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
                <div className="flex items-center gap-3 mb-8 pb-4 border-b border-gray-200">
                    <div className="bg-blue-100 p-2.5 rounded-xl">
                        <Bookmark className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Saved Articles</h1>
                        <p className="text-gray-500 text-sm">Read later or keep for reference</p>
                    </div>
                </div>

                {loading || authLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-blue-500">
                        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : bookmarkedPosts.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-3xl shadow-sm border border-gray-100 p-12 text-center mt-6"
                    >
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-50 rounded-full mb-6">
                            <Bookmark className="w-10 h-10 text-blue-400 opacity-50" />
                        </div>
                        <h2 className="text-2xl font-black text-gray-800 tracking-tight mb-2">No bookmarks yet</h2>
                        <p className="text-gray-500 max-w-sm mx-auto mb-8">
                            Click the bookmark icon on any article you want to save for reading later.
                        </p>
                        <Link href="/" className="inline-block bg-blue-600 font-bold text-white px-8 py-3.5 rounded-xl hover:bg-blue-700 hover:-translate-y-0.5 transition-all shadow-md">
                            Browse Latest News
                        </Link>
                    </motion.div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        <AnimatePresence>
                            {bookmarkedPosts.map(post => (
                                <motion.div
                                    key={post.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="relative group"
                                >
                                    <NewsCard post={post} />
                                    {/* Small indicator it's bookmarked, hovering to unbookmark isn't required manually since clicking inside card will navigate, they can unbookmark from inside the post but it's handy if we add it directly too. */}
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </main>
            <Footer />
        </div>
    );
}
