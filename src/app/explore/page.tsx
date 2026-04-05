'use client';

import { useState, useEffect, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Search, Rocket, Filter, ExternalLink, Loader2, Calendar, Newspaper, AlertCircle, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Article {
    id: string;
    title: string;
    description: string;
    url: string;
    image: string;
    publishedAt: string;
    source: string;
    category?: string;
}

const CATEGORIES = [
    { id: '', name: 'Trending' },
    { id: 'politics', name: 'राजनीति' },
    { id: 'business', name: 'कारोबार' },
    { id: 'sports', name: 'खेल' },
    { id: 'technology', name: 'तकनीक' },
    { id: 'entertainment', name: 'मनोरंजन' },
    { id: 'world', name: 'दुनिया' }
];

export default function GlobalNewsPage() {
    const [articles, setArticles] = useState<Article[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [query, setQuery] = useState('');
    const [category, setCategory] = useState('');
    const [error, setError] = useState('');

    const fetchNews = useCallback(async (searchQuery = query, cat = category, isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);

        setError('');
        try {
            const params = new URLSearchParams();
            if (searchQuery) params.append('q', searchQuery);
            if (cat) params.append('category', cat);
            params.append('limit', '60');

            const res = await fetch(`/api/news?${params.toString()}`);
            if (!res.ok) throw new Error('सर्वर से डेटा प्राप्त करने में विफल।');

            const data = await res.json();
            setArticles(data.articles || []);
        } catch (err: any) {
            setError(err.message || 'न्यूज़ लोड करने में समस्या आई।');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [query, category]);

    useEffect(() => {
        fetchNews('', category);
    }, [category, fetchNews]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchNews(query, category);
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] flex flex-col">
            <Navbar />

            <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
                {/* Hero Section */}
                <div className="relative overflow-hidden bg-gradient-to-br from-gray-900 to-red-950 p-8 md:p-12 rounded-[2rem] shadow-2xl mb-10 text-white">
                    <div className="relative z-10">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center gap-3 mb-4"
                        >
                            <span className="px-3 py-1 bg-red-600 rounded-full text-[10px] font-black uppercase tracking-widest animate-pulse">Live Feed</span>
                            <span className="text-gray-400 text-sm font-medium">Auto-synced every 15 mins</span>
                        </motion.div>
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-4xl md:text-5xl font-black mb-4 leading-tight"
                        >
                            ग्लोबल <span className="text-red-500">लाइव न्यूज़</span><br />
                            पूरी दुनिया की खबरें एक ही जगह
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-gray-300 max-w-xl mb-8 font-medium leading-relaxed"
                        >
                            Google News, NDTV और AajTak जैसे विश्वसनीय स्रोतों से सीधा प्रसारण। बिना किसी रुकावट के पढ़ें और अपडेट रहें।
                        </motion.p>

                        <div className="flex flex-wrap items-center gap-4">
                            <form onSubmit={handleSearch} className="relative flex-1 max-w-md group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-red-500 transition-colors" />
                                <input
                                    type="text"
                                    placeholder="खबरें खोजें..."
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl focus:ring-2 focus:ring-red-500/50 outline-none transition-all placeholder:text-gray-500 text-white font-bold"
                                />
                            </form>
                            <button
                                onClick={() => fetchNews(query, category, true)}
                                disabled={refreshing}
                                className="p-4 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 rounded-2xl transition-all disabled:opacity-50"
                            >
                                <RefreshCw className={`w-6 h-6 ${refreshing ? 'animate-spin' : ''}`} />
                            </button>
                        </div>
                    </div>
                    {/* Abstract Shapes */}
                    <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/20 rounded-full blur-[120px] -mr-48 -mt-48" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-600/10 rounded-full blur-[100px] -ml-32 -mb-32" />
                </div>

                {/* Filters */}
                <div className="flex items-center gap-3 overflow-x-auto pb-6 no-scrollbar sticky top-24 z-30 bg-[#f8fafc]/80 backdrop-blur-sm -mx-4 px-4 pt-2">
                    {CATEGORIES.map((cat, idx) => (
                        <button
                            key={cat.id || 'all'}
                            onClick={() => setCategory(cat.id)}
                            className={`px-6 py-3 rounded-2xl text-sm font-black whitespace-nowrap transition-all border ${category === cat.id
                                    ? 'bg-red-600 text-white border-red-600 shadow-lg shadow-red-600/20'
                                    : 'bg-white text-gray-600 border-gray-200 hover:border-red-200 hover:bg-red-50/30'
                                }`}
                        >
                            {cat.name || 'सभी खबरें'}
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <AnimatePresence mode="wait">
                    {loading ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center justify-center py-32"
                        >
                            <div className="relative">
                                <div className="w-16 h-16 border-4 border-red-600/20 rounded-full border-t-red-600 animate-spin" />
                                <Rocket className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-red-600" />
                            </div>
                            <p className="mt-6 text-gray-500 font-black tracking-widest uppercase text-xs animate-pulse">Synchronizing News Feed...</p>
                        </motion.div>
                    ) : error ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white p-12 rounded-[2.5rem] border border-red-100 shadow-xl shadow-red-900/5 text-center max-w-2xl mx-auto"
                        >
                            <div className="w-20 h-20 bg-red-50 text-red-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                <AlertCircle className="w-10 h-10" />
                            </div>
                            <h2 className="text-2xl font-black text-gray-900 mb-2">कनेक्शन एरर!</h2>
                            <p className="text-gray-500 font-medium mb-8">{error}</p>
                            <button
                                onClick={() => fetchNews()}
                                className="px-8 py-4 bg-red-600 text-white rounded-2xl font-black shadow-lg shadow-red-600/30 hover:bg-red-700 transition-all active:scale-95"
                            >
                                फिर से कोशिश करें
                            </button>
                        </motion.div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                        >
                            {articles.map((article, i) => (
                                <motion.a
                                    key={article.id || i}
                                    href={article.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    whileHover={{ y: -8 }}
                                    className="bg-white rounded-[2rem] overflow-hidden shadow-sm border border-gray-100 hover:shadow-2xl hover:shadow-red-900/5 transition-all group flex flex-col h-full"
                                >
                                    <div className="relative aspect-[16/10] bg-gray-100 overflow-hidden">
                                        {article.image ? (
                                            <img
                                                src={article.image}
                                                alt={article.title}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center text-gray-300">
                                                <Newspaper className="w-12 h-12 mb-3 opacity-20" />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Image Unavailable</span>
                                            </div>
                                        )}
                                        <div className="absolute top-4 left-4">
                                            <div className="px-4 py-2 bg-white/90 backdrop-blur-md rounded-xl shadow-lg border border-white/50 text-red-600 text-[10px] font-black uppercase tracking-wider">
                                                {article.source}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-7 flex flex-col flex-1">
                                        <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-4">
                                            <Calendar className="w-3.5 h-3.5 text-red-500" />
                                            <span>{new Date(article.publishedAt).toLocaleDateString('hi-IN', {
                                                day: 'numeric', month: 'short'
                                            })} / {new Date(article.publishedAt).toLocaleTimeString('hi-IN', {
                                                hour: '2-digit', minute: '2-digit'
                                            })}</span>
                                        </div>

                                        <h2 className="text-xl font-black text-gray-900 leading-[1.3] mb-4 group-hover:text-red-600 transition-colors line-clamp-3">
                                            {article.title}
                                        </h2>

                                        <p className="text-gray-600 text-sm leading-relaxed line-clamp-3 font-medium flex-1">
                                            {article.description}
                                        </p>

                                        <div className="mt-8 pt-6 border-t border-gray-50 flex items-center justify-between">
                                            <span className="text-red-600 font-black text-xs uppercase tracking-widest flex items-center gap-2 group-hover:gap-3 transition-all">
                                                विस्तार से पढ़ें <ExternalLink className="w-4 h-4" />
                                            </span>
                                            {article.category && (
                                                <span className="px-3 py-1 bg-gray-100 text-gray-500 rounded-lg text-[10px] font-black uppercase tracking-wider group-hover:bg-red-50 group-hover:text-red-600 transition-colors">
                                                    #{article.category}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </motion.a>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
            <Footer />
        </div>
    );
}
